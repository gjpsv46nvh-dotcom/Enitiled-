# Finally Entitled — government data operations

## First deployment
1. Deploy the repository.
2. In GitHub, open Actions → Check government data → Run workflow.
3. The first successful run establishes `source-snapshots.json`.
4. Vercel redeploys after the workflow commits the status. Only then should the site show green.

## When the light turns amber
A monitored official page differs from the last accepted baseline. The calculator rules do **not** change automatically.
1. Review the changed government source.
2. Update any affected structured entitlement rules/content and test them.
3. When satisfied that the current source is the accepted baseline, run:
   `python scripts/check-government-sources.py --accept-current`
4. Commit `source-snapshots.json`.
5. Run the normal government-data workflow again. It will return green only if the live pages still match the reviewed baseline.

## Failure behavior
If a source cannot be checked, the status remains non-green. A failed or changed source can never silently become green on the next daily run.
