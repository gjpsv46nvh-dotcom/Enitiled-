#!/usr/bin/env python3
"""
Finally Entitled official-source freshness checker v1.2.

Designed for GitHub Actions:
- retries temporary failures
- uses browser-like request headers
- reads responses in chunks
- normalises HTML before hashing to reduce false alarms
- keeps source failures/reviews visible in data-status.json
- does NOT fail the whole GitHub workflow merely because a source needs review
- never automatically accepts a changed source as the reviewed baseline
"""
import datetime
import hashlib
import html
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
STATUS = ROOT / "data-status.json"
SNAP = ROOT / "source-snapshots.json"

SOURCES = [
    {"id":"services-australia-guide","label":"Australian Government payments","jurisdiction":"Commonwealth","url":"https://www.servicesaustralia.gov.au/guide-to-australian-government-payments?context=22"},
    {"id":"energy-gov-au","label":"Energy, solar & battery support","jurisdiction":"Australia + states/territories","url":"https://www.energy.gov.au/rebates-view"},
    # /resources/home is less likely to reject automated checks than the bare Tas homepage.
    {"id":"tas-concessions","label":"Tasmanian concessions","jurisdiction":"Tasmania","url":"https://www.concessions.tas.gov.au/resources/home"},
    {"id":"nsw-cost-living","label":"NSW rebates & cost-of-living support","jurisdiction":"New South Wales","url":"https://www.nsw.gov.au/money-and-taxes/cost-of-living-hub"},
    {"id":"vic-concessions","label":"Victorian concessions & benefits","jurisdiction":"Victoria","url":"https://services.dffh.vic.gov.au/concessions-and-benefits"},
    {"id":"qld-concessions","label":"Queensland concessions","jurisdiction":"Queensland","url":"https://www.qld.gov.au/community/cost-of-living-support/concessions"},
    {"id":"sa-concessions","label":"South Australian concessions","jurisdiction":"South Australia","url":"https://www.sa.gov.au/topics/care-and-support/concessions"},
    {"id":"wa-concessions","label":"Western Australian concessions","jurisdiction":"Western Australia","url":"https://www.wa.gov.au/service/community-services/community-support/concessions"},
    {"id":"act-cost-living","label":"ACT cost-of-living support","jurisdiction":"ACT","url":"https://www.act.gov.au/cost-of-living-support"},
    {"id":"nt-concessions","label":"Northern Territory concessions","jurisdiction":"Northern Territory","url":"https://nt.gov.au/community/concessions-and-payments"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/140.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
    "Cache-Control": "no-cache",
}

def fetch(url, attempts=3, timeout=45):
    last = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as response:
                chunks = []
                while True:
                    chunk = response.read(1024 * 256)
                    if not chunk:
                        break
                    chunks.append(chunk)
                    # Plenty for detecting meaningful page changes while avoiding huge reads.
                    if sum(map(len, chunks)) >= 5 * 1024 * 1024:
                        break
                return b"".join(chunks)
        except Exception as exc:
            last = exc
            if attempt < attempts - 1:
                time.sleep(3 * (attempt + 1))
    raise last

def stable_hash(data):
    # PDFs/binary files are hashed as-is.
    if b"<html" not in data[:10000].lower() and b"<!doctype html" not in data[:10000].lower():
        return hashlib.sha256(data).hexdigest()

    text = data.decode("utf-8", errors="ignore")
    # Remove common volatile/non-content material.
    text = re.sub(r"(?is)<script\b.*?</script>", " ", text)
    text = re.sub(r"(?is)<style\b.*?</style>", " ", text)
    text = re.sub(r"(?is)<!--.*?-->", " ", text)
    text = re.sub(r"\s+", " ", html.unescape(text)).strip()
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def fetch_hashes():
    hashes, errors = {}, {}
    for source in SOURCES:
        sid = source["id"]
        try:
            hashes[sid] = stable_hash(fetch(source["url"]))
            print("OK:", sid)
        except urllib.error.HTTPError as exc:
            errors[sid] = f"HTTP {exc.code}: {exc.reason}"
            print("WARN:", sid, errors[sid])
        except Exception as exc:
            errors[sid] = str(exc)[:180]
            print("WARN:", sid, errors[sid])
    return hashes, errors

def load_json(path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback

def accept_current():
    hashes, errors = fetch_hashes()
    if errors:
        print("Cannot accept baseline while source checks are failing:", errors)
        return 1
    SNAP.write_text(json.dumps(hashes, indent=2) + "\n", encoding="utf-8")
    print("Accepted current official-source snapshots as reviewed baseline.")
    return 0

def main():
    if "--accept-current" in sys.argv:
        return accept_current()

    today = datetime.date.today().isoformat()
    now = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    status = load_json(STATUS, {"schemaVersion": 1, "status": "pending", "sources": []})
    baseline = load_json(SNAP, None) if SNAP.exists() else None
    hashes, errors = fetch_hashes()

    # Only establish the first baseline after every source succeeds.
    if baseline is None and not errors and len(hashes) == len(SOURCES):
        SNAP.write_text(json.dumps(hashes, indent=2) + "\n", encoding="utf-8")
        baseline = dict(hashes)

    rows = []
    any_review = False

    for source in SOURCES:
        row = dict(source)
        sid = source["id"]

        if sid in errors:
            row.update(
                status="check_failed",
                checked=today,
                note=errors[sid],
            )
            any_review = True
        elif baseline is None:
            row.update(
                status="pending",
                checked=today,
                note="Waiting for all monitored sources to complete successfully before creating the first baseline.",
            )
            any_review = True
        elif sid not in baseline:
            row.update(
                status="review",
                checked=today,
                note="New monitored source has no accepted baseline.",
            )
            any_review = True
        elif baseline[sid] != hashes[sid]:
            row.update(
                status="review",
                checked=today,
                note="Official source changed since the accepted baseline.",
            )
            any_review = True
        else:
            row.update(status="up_to_date", checked=today)

        rows.append(row)

    status["lastCheckAttempt"] = now
    if not errors:
        status["lastSuccessfulCheck"] = now
    status["sources"] = rows
    status["status"] = "review_required" if any_review else "up_to_date"

    STATUS.write_text(json.dumps(status, indent=2) + "\n", encoding="utf-8")
    print("RESULT:", status["status"])

    # Source failure/review should make the website amber, not make GitHub Actions red.
    return 0

if __name__ == "__main__":
    sys.exit(main())
