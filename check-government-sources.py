#!/usr/bin/env python3
"""Finally Entitled official-source freshness checker v1.5.

Checks official government sources only. Each jurisdiction can have multiple
official URLs; if a primary page blocks automated access, the checker tries a
second official page rather than falsely marking the source as verified.
"""
import concurrent.futures
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
VERIFIED = ROOT / "source-verifications.json"
MANUAL_VERIFICATION_DAYS = 14

SOURCES = [
    {
        "id": "business-gov-au-grants",
        "label": "Australian business grants & programs",
        "jurisdiction": "Commonwealth + states/territories",
        "urls": [
            "https://business.gov.au/grants-and-programs",
            "https://business.gov.au/grants-and-support",
        ],
    },
    {
        "id": "services-australia-guide",
        "label": "Australian Government payments",
        "jurisdiction": "Commonwealth",
        "urls": [
            "https://www.servicesaustralia.gov.au/guide-to-australian-government-payments?context=22",
            "https://www.servicesaustralia.gov.au/historical-versions-guide-to-australian-government-payments?context=22",
        ],
    },
    {
        "id": "energy-gov-au",
        "label": "Energy, solar & battery support",
        "jurisdiction": "Australia + states/territories",
        "urls": [
            "https://www.energy.gov.au/rebates",
            "https://www.energy.gov.au/households",
        ],
    },
    {
        "id": "tas-concessions",
        "label": "Tasmanian concessions",
        "jurisdiction": "Tasmania",
        "urls": [
            "https://www.concessions.tas.gov.au/",
            "https://www.concessions.tas.gov.au/concessions_cards",
        ],
    },
    {
        "id": "nsw-cost-living",
        "label": "NSW rebates & cost-of-living support",
        "jurisdiction": "New South Wales",
        "urls": ["https://www.nsw.gov.au/money-and-taxes/cost-of-living-hub"],
    },
    {
        "id": "vic-concessions",
        "label": "Victorian concessions & benefits",
        "jurisdiction": "Victoria",
        "urls": [
            "https://www.housing.vic.gov.au/concessions",
            "https://services.dffh.vic.gov.au/concessions-and-benefits",
        ],
    },
    {
        "id": "qld-concessions",
        "label": "Queensland concessions",
        "jurisdiction": "Queensland",
        "urls": ["https://www.qld.gov.au/community/cost-of-living-support/concessions"],
    },
    {
        "id": "sa-concessions",
        "label": "South Australian concessions",
        "jurisdiction": "South Australia",
        "urls": ["https://www.sa.gov.au/topics/care-and-support/concessions"],
    },
    {
        "id": "wa-concessions",
        "label": "Western Australian concessions",
        "jurisdiction": "Western Australia",
        "urls": [
            "https://www.wa.gov.au/organisation/department-of-communities/concessions-available-western-australia"
        ],
    },
    {
        "id": "act-cost-living",
        "label": "ACT cost-of-living support",
        "jurisdiction": "ACT",
        "urls": ["https://www.act.gov.au/money-and-tax/cost-of-living-support"],
    },
    {
        "id": "nt-concessions",
        "label": "Northern Territory concessions",
        "jurisdiction": "Northern Territory",
        "urls": [
            "https://nt.gov.au/community/concessions-and-payments",
            "https://nt.gov.au/community/concessions-and-payments/nt-concession-scheme",
        ],
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
    "Cache-Control": "no-cache",
}

def fetch(url, timeout=12):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        parts, total = [], 0
        limit = 2 * 1024 * 1024
        while total < limit:
            b = r.read(min(262144, limit - total))
            if not b:
                break
            parts.append(b)
            total += len(b)
        data = b"".join(parts)
        if len(data) < 500:
            raise RuntimeError("Response was unexpectedly small")
        return data

def stable_hash(data):
    head = data[:10000].lower()
    if b"<html" not in head and b"<!doctype html" not in head:
        return hashlib.sha256(data).hexdigest()
    s = data.decode("utf-8", "ignore")
    s = re.sub(r"(?is)<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->", " ", s)
    s = re.sub(r"(?is)<svg\b.*?</svg>", " ", s)
    s = re.sub(r"\b(?:nonce|data-[\w-]+)=[\"'][^\"']*[\"']", " ", s)
    s = re.sub(r"\s+", " ", html.unescape(s)).strip()
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def try_source(source):
    failures = []
    for url in source["urls"]:
        for attempt in range(2):
            try:
                data = fetch(url)
                return source["id"], stable_hash(data), None, url
            except urllib.error.HTTPError as e:
                msg = f"{url}: HTTP {e.code} {e.reason}"
            except Exception as e:
                msg = f"{url}: {str(e)[:120]}"
            if attempt == 0:
                time.sleep(0.6)
        failures.append(msg)
    return source["id"], None, " | ".join(failures)[:400], None

def fetch_hashes():
    hashes, errors, used_urls = {}, {}, {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        futures = [ex.submit(try_source, s) for s in SOURCES]
        for f in concurrent.futures.as_completed(futures):
            sid, h, err, used = f.result()
            if err:
                errors[sid] = err
                print("WARN:", sid, err)
            else:
                hashes[sid] = h
                used_urls[sid] = used
                print("OK:", sid, used)
    return hashes, errors, used_urls

def load(path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback

def accept_current():
    hashes, errors, used_urls = fetch_hashes()
    if errors or len(hashes) != len(SOURCES):
        print("Cannot accept baseline while checks fail:", errors)
        return 1
    SNAP.write_text(json.dumps(hashes, indent=2) + "\n", encoding="utf-8")
    print("Accepted current snapshots.")
    return 0

def parse_date(value):
    try:
        return datetime.date.fromisoformat(str(value)[:10])
    except Exception:
        return None

def manual_is_current(entry, today_date):
    d = parse_date((entry or {}).get("verifiedAt"))
    return bool(d and 0 <= (today_date - d).days <= MANUAL_VERIFICATION_DAYS)

def main():
    if "--accept-current" in sys.argv:
        return accept_current()

    today_date = datetime.date.today()
    today = today_date.isoformat()
    now = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    old = load(STATUS, {"schemaVersion": 1, "sources": []})
    baseline = load(SNAP, {}) if SNAP.exists() else {}
    verified = load(VERIFIED, {}) if VERIFIED.exists() else {}
    hashes, errors, used_urls = fetch_hashes()

    # Establish baselines independently. One anti-bot government site must not
    # prevent every other successfully fetched source from becoming green.
    baseline_changed = False
    for sid, h in hashes.items():
        if sid not in baseline:
            baseline[sid] = h
            baseline_changed = True
    if baseline_changed:
        SNAP.write_text(json.dumps(baseline, indent=2) + "\n", encoding="utf-8")

    rows, review = [], False
    for s in SOURCES:
        sid = s["id"]
        manual = verified.get(sid, {})
        row = {
            "id": sid,
            "label": s["label"],
            "jurisdiction": s["jurisdiction"],
            "url": used_urls.get(sid, manual.get("url", s["urls"][0])),
        }

        if sid in hashes:
            if baseline.get(sid) == hashes[sid]:
                row.update(status="up_to_date", checked=today, method="automated")
            else:
                row.update(status="review", checked=today, method="automated",
                           note="Official source changed since accepted baseline.")
                review = True
        elif manual_is_current(manual, today_date):
            # Some official sites reject GitHub-hosted automated requests. A
            # recent human verification against the official source is valid,
            # but expires automatically so green can never persist forever.
            row.update(status="up_to_date", checked=manual["verifiedAt"],
                       method="manual_official_verification",
                       note="Official source manually verified; automated access is currently blocked.")
        else:
            row.update(status="check_failed", checked=today, method="automated",
                       note=errors.get(sid, "Official source could not be verified."))
            review = True
        rows.append(row)

    old["lastCheckAttempt"] = now
    if not review:
        old["lastSuccessfulCheck"] = now
    old["sources"] = rows
    old["status"] = "review_required" if review else "up_to_date"
    STATUS.write_text(json.dumps(old, indent=2) + "\n", encoding="utf-8")
    print("RESULT:", old["status"])
    return 0

if __name__ == "__main__":
    sys.exit(main())
