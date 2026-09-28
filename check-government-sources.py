#!/usr/bin/env python3
"""Finally Entitled official-source freshness checker v1.3."""
import concurrent.futures, datetime, hashlib, html, json, pathlib, re, sys, time
import urllib.error, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent
STATUS = ROOT / "data-status.json"
SNAP = ROOT / "source-snapshots.json"

SOURCES = [
 {"id":"services-australia-guide","label":"Australian Government payments","jurisdiction":"Commonwealth","url":"https://www.servicesaustralia.gov.au/guide-to-australian-government-payments?context=22"},
 {"id":"energy-gov-au","label":"Energy, solar & battery support","jurisdiction":"Australia + states/territories","url":"https://www.energy.gov.au/rebates-view"},
 {"id":"tas-concessions","label":"Tasmanian concessions","jurisdiction":"Tasmania","url":"https://www.concessions.tas.gov.au/resources/home"},
 {"id":"nsw-cost-living","label":"NSW rebates & cost-of-living support","jurisdiction":"New South Wales","url":"https://www.nsw.gov.au/money-and-taxes/cost-of-living-hub"},
 {"id":"vic-concessions","label":"Victorian concessions & benefits","jurisdiction":"Victoria","url":"https://services.dffh.vic.gov.au/concessions-and-benefits"},
 {"id":"qld-concessions","label":"Queensland concessions","jurisdiction":"Queensland","url":"https://www.qld.gov.au/community/cost-of-living-support/concessions"},
 {"id":"sa-concessions","label":"South Australian concessions","jurisdiction":"South Australia","url":"https://www.sa.gov.au/topics/care-and-support/concessions"},
 {"id":"wa-concessions","label":"Western Australian concessions","jurisdiction":"Western Australia","url":"https://www.wa.gov.au/service/community-services/community-support/concessions"},
 {"id":"act-cost-living","label":"ACT cost-of-living support","jurisdiction":"ACT","url":"https://www.act.gov.au/cost-of-living-support"},
 {"id":"nt-concessions","label":"Northern Territory concessions","jurisdiction":"Northern Territory","url":"https://nt.gov.au/community/concessions-and-payments"},
]
HEADERS={"User-Agent":"Mozilla/5.0 (compatible; FinallyEntitledSourceCheck/1.3; +https://github.com/)","Accept":"text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8","Accept-Language":"en-AU,en;q=0.9"}

def fetch(url, attempts=2, timeout=20):
    last=None
    for n in range(attempts):
        try:
            req=urllib.request.Request(url,headers=HEADERS)
            with urllib.request.urlopen(req,timeout=timeout) as r:
                parts=[]; total=0
                while total < 3*1024*1024:
                    b=r.read(min(262144,3*1024*1024-total))
                    if not b: break
                    parts.append(b); total += len(b)
                return b"".join(parts)
        except Exception as e:
            last=e
            if n+1 < attempts: time.sleep(1.5)
    raise last

def stable_hash(data):
    head=data[:10000].lower()
    if b"<html" not in head and b"<!doctype html" not in head:
        return hashlib.sha256(data).hexdigest()
    s=data.decode("utf-8","ignore")
    s=re.sub(r"(?is)<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->"," ",s)
    s=re.sub(r"\s+"," ",html.unescape(s)).strip()
    return hashlib.sha256(s.encode()).hexdigest()

def one(source):
    try: return source["id"],stable_hash(fetch(source["url"])),None
    except urllib.error.HTTPError as e: return source["id"],None,f"HTTP {e.code}: {e.reason}"
    except Exception as e: return source["id"],None,str(e)[:180]

def fetch_hashes():
    hashes={}; errors={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        futures=[ex.submit(one,s) for s in SOURCES]
        for f in concurrent.futures.as_completed(futures):
            sid,h,err=f.result()
            if err: errors[sid]=err; print("WARN:",sid,err)
            else: hashes[sid]=h; print("OK:",sid)
    return hashes,errors

def load(path,fallback):
    try:return json.loads(path.read_text(encoding="utf-8"))
    except Exception:return fallback

def accept_current():
    hashes,errors=fetch_hashes()
    if errors:
        print("Cannot accept baseline while checks fail:",errors); return 1
    SNAP.write_text(json.dumps(hashes,indent=2)+"\n",encoding="utf-8")
    print("Accepted current snapshots."); return 0

def main():
    if "--accept-current" in sys.argv:return accept_current()
    today=datetime.date.today().isoformat()
    now=datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    old=load(STATUS,{"schemaVersion":1,"sources":[]})
    baseline=load(SNAP,None) if SNAP.exists() else None
    hashes,errors=fetch_hashes()

    if baseline is None and not errors and len(hashes)==len(SOURCES):
        SNAP.write_text(json.dumps(hashes,indent=2)+"\n",encoding="utf-8")
        baseline=dict(hashes)

    rows=[]; review=False
    for s in SOURCES:
        row=dict(s); sid=s["id"]
        if sid in errors:
            row.update(status="check_failed",checked=today,note=errors[sid]); review=True
        elif baseline is None:
            row.update(status="pending",checked=today,note="Waiting for a complete successful first baseline."); review=True
        elif sid not in baseline:
            row.update(status="review",checked=today,note="New source has no accepted baseline."); review=True
        elif baseline[sid] != hashes[sid]:
            row.update(status="review",checked=today,note="Official source changed since accepted baseline."); review=True
        else:
            row.update(status="up_to_date",checked=today)
        rows.append(row)

    old["lastCheckAttempt"]=now
    if not errors: old["lastSuccessfulCheck"]=now
    old["sources"]=rows
    old["status"]="review_required" if review else "up_to_date"
    STATUS.write_text(json.dumps(old,indent=2)+"\n",encoding="utf-8")
    print("RESULT:",old["status"])
    return 0

if __name__=="__main__": sys.exit(main())
