#!/usr/bin/env python3
"""
Finally Entitled official-source freshness checker.
Safe-by-design: this script updates freshness metadata and flags changed sources.
It never edits entitlement calculation rules automatically.
"""
import json, hashlib, urllib.request, datetime, pathlib, sys

ROOT=pathlib.Path(__file__).resolve().parents[1]
STATUS=ROOT/"data-status.json"
SNAP=ROOT/"source-snapshots.json"
SOURCES=[{'id': 'services-australia-guide', 'label': 'Australian Government payments', 'jurisdiction': 'Commonwealth', 'url': 'https://www.servicesaustralia.gov.au/guide-to-australian-government-payments?context=22'}, {'id': 'energy-gov-au', 'label': 'Energy, solar & battery support', 'jurisdiction': 'Australia + states/territories', 'url': 'https://www.energy.gov.au/rebates'}, {'id': 'tas-concessions', 'label': 'Tasmanian concessions', 'jurisdiction': 'Tasmania', 'url': 'https://www.concessions.tas.gov.au/'}, {'id': 'nsw-cost-living', 'label': 'NSW rebates & cost-of-living support', 'jurisdiction': 'New South Wales', 'url': 'https://www.nsw.gov.au/money-and-taxes/cost-of-living-hub'}, {'id': 'vic-concessions', 'label': 'Victorian concessions & benefits', 'jurisdiction': 'Victoria', 'url': 'https://services.dffh.vic.gov.au/concessions-and-benefits'}, {'id': 'qld-concessions', 'label': 'Queensland concessions', 'jurisdiction': 'Queensland', 'url': 'https://www.qld.gov.au/community/cost-of-living-support/concessions'}, {'id': 'sa-concessions', 'label': 'South Australian concessions', 'jurisdiction': 'South Australia', 'url': 'https://www.sa.gov.au/topics/care-and-support/concessions'}, {'id': 'wa-concessions', 'label': 'Western Australian concessions', 'jurisdiction': 'Western Australia', 'url': 'https://www.wa.gov.au/service/community-services/community-support/concessions'}, {'id': 'act-cost-living', 'label': 'ACT cost-of-living support', 'jurisdiction': 'ACT', 'url': 'https://www.act.gov.au/cost-of-living-support'}, {'id': 'nt-concessions', 'label': 'Northern Territory concessions', 'jurisdiction': 'Northern Territory', 'url': 'https://nt.gov.au/community/concessions-and-payments'}]
def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"FinallyEntitledDataCheck/1.0"})
    with urllib.request.urlopen(req,timeout=30) as r: return r.read()
def main():
    today=datetime.date.today().isoformat()
    old=json.loads(SNAP.read_text()) if SNAP.exists() else {}
    status=json.loads(STATUS.read_text())
    new={}; rows=[]; any_review=False; any_failure=False
    for s in SOURCES:
        row=dict(s)
        try:
            body=fetch(s["url"])
            h=hashlib.sha256(body).hexdigest()
            new[s["id"]]=h
            changed=s["id"] in old and old[s["id"]]!=h
            row["status"]="review" if changed else "up_to_date"
            row["checked"]=today
            row["rulesDate"]=next((x.get("rulesDate",today) for x in status.get("sources",[]) if x.get("id")==s["id"]),today)
            any_review|=changed
        except Exception as e:
            row["status"]="check_failed"; row["checked"]=today
            row["note"]=str(e)[:160]; any_failure=True
        rows.append(row)
    # A successful fetch can advance lastSuccessfulCheck, but any detected change turns the light amber.
    if not any_failure:
        status["lastSuccessfulCheck"]=datetime.datetime.now().astimezone().isoformat(timespec="seconds")
        SNAP.write_text(json.dumps(new,indent=2))
    status["sources"]=rows
    status["status"]="review_required" if (any_review or any_failure) else "up_to_date"
    STATUS.write_text(json.dumps(status,indent=2))
    print(status["status"])
    return 2 if any_review else (1 if any_failure else 0)
if __name__=="__main__": sys.exit(main())
