# Finally Entitled — production deployment

You already uploaded V9. For V9.1, replace the repository contents with the files in this build.

Important:
- Upload `rules-2026-27.js`.
- Upload `data-status.json`.
- Upload the `scripts` folder.
- Upload `.github/workflows/check-government-data.yml`.
- Keep the folder/file names exactly as supplied.

After the GitHub commit:
1. Wait for Vercel to finish deploying.
2. Open the live site in a private/incognito tab and confirm the old V8/V9 prototype wording is gone.
3. GitHub → Actions → Check government data → Run workflow.
4. Wait for that workflow to commit its status update and for Vercel to redeploy.
5. Reload the site. The source indicator should show green only after a successful live check.
6. If GitHub cannot push the status commit: Settings → Actions → General → Workflow permissions → Read and write permissions.

If a monitored government source later changes, the indicator stays non-green until that source is reviewed and the new baseline is deliberately accepted. Calculation rules are never silently overwritten.
