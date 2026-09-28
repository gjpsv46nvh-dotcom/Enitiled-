#!/usr/bin/env python3
"""
Finally Entitled official-source freshness checker.
Safety rule: a changed source NEVER becomes the accepted baseline automatically.
Changed sources remain review_required on every run until a human intentionally
accepts the new snapshot with --accept-current.
"""
import json, hashlib, urllib.request, datetime, pathlib, sys

ROOT=pathlib.Path(__file__).resolve().parents[1]
STATUS=ROOT/"data-status.json"
SNAP=ROOT/"source-snapshots.json"
SOURCES=[{'id': 'services-australia-guide', 'label': 'Australian Government payments', 'jurisdiction': 'Commonwealth', 'url': 'https://www.servicesaustralia.gov.au/guide-to-australian-government-payments?context=22'}, {'id': 'energy-gov-au', 'label': 'Energy, solar & battery support', 'jurisdiction': 'Australia + states/territories', 'url': 'https://www.energy.gov.au/rebates'}, {'id': 'tas-concessions', 'label': 'Tasmanian concessions', 'jurisdiction': 'Tasmania', 'url': 'https://www.concessions.tas.gov.au/'}, {'id': 'nsw-cost-living', 'label': 'NSW rebates & cost-of-living support', 'jurisdiction': 'New South Wales', 'url': 'https://www.nsw.gov.au/money-and-taxes/cost-of-living-hub'}, {'id': 'vic-concessions', 'label': 'Victorian concessions & benefits', 'jurisdiction': 'Victoria', 'url': 'https://services.dffh.vic.gov.au/concessions-and-benefits'}, {'id': 'qld-concessions', 'label': 'Queensland concessions', 'jurisdiction': 'Queensland', 'url': 'https://www.qld.gov.au/community/cost-of-living-support/concessions'}, {'id': 'sa-concessions', 'label': 'South Australian concessions', 'jurisdiction': 'South Australia', 'url': 'https://www.sa.gov.au/topics/care-and-support/concessions'}, {'id': 'wa-concessions', 'label': 'Western Australian concessions', 'jurisdiction': 'Western Australia', 'url': 'https://www.wa.gov.au/service/community-services/community-support/concessions'}, {'id': 'act-cost-living', 'label': 'ACT cost-of-living support', 'jurisdiction': 'ACT', 'url': 'https://www.act.gov.au/cost-of-living-support'}, {'id': 'nt-concessions', 'label': 'Northern Territory concessions', 'jurisdiction': 'Northern Territory', 'url': 'https://nt.gov.au/community/concessions-and-payments'}]

def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"FinallyEntitledDataCheck/1.0"})
    with urllib.request.urlopen(req,timeout=30) as r: return r.read()

def fetch_hashes():
    hashes={}; errors={}
    for s in SOURCES:
        try: hashes[s["id"]]=hashlib.sha256(fetch(s["url"])).hexdigest()
        except Exception as e: errors[s["id"]]=str(e)[:160]
    return hashes,errors

def accept_current():
    hashes,errors=fetch_hashes()
    if errors:
        print("Cannot accept baseline: one or more source checks failed",errors); return 1
    SNAP.write_text(json.dumps(hashes,indent=2))
    print("Accepted current official-source snapshots as reviewed baseline.")
    return 0

def main():
    if "--accept-current" in sys.argv: return accept_current()
    today=datetime.date.today().isoformat()
    status=json.loads(STATUS.read_text())
    baseline=json.loads(SNAP.read_text()) if SNAP.exists() else None
    hashes,errors=fetch_hashes()
    rows=[]; any_review=False
    # First successful run establishes a baseline only when none exists.
    first_run=baseline is None and not errors and len(hashes)==len(SOURCES)
    if first_run:
        SNAP.write_text(json.dumps(hashes,indent=2))
        baseline=dict(hashes)
    for s in SOURCES:
        row=dict(s); sid=s["id"]
        if sid in errors:
            row.update(status="check_failed",checked=today,note=errors[sid]); any_review=True
        elif baseline is None:
            row.update(status="pending",checked=today); any_review=True
        elif baseline.get(sid)!=hashes.get(sid):
            row.update(status="review",checked=today,note="Official source changed since accepted baseline."); any_review=True
        else:
            row.update(status="up_to_date",checked=today)
        rows.append(row)
    if not errors:
        status["lastSuccessfulCheck"]=datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    status["sources"]=rows
    status["status"]="review_required" if any_review else "up_to_date"
    STATUS.write_text(json.dumps(status,indent=2))
    print(status["status"])
    return 2 if any_review else 0

if __name__=="__main__": sys.exit(main())
