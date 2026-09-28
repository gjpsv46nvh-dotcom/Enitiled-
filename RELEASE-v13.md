# Finally Entitled v13 — pre-launch fixes

Updated 28 September 2026. Deploy the contents of this ZIP to replace the current site. The public URL remains on its previous version until deployment.

## Changes
- Adding a child now selects “Yes”; an empty child list or future child birth date is rejected.
- Family payment estimates explain the assumption that entered earnings equal adjusted taxable income. FTB A/B and CCS cards use conditional labels, and the annual summary has the same caveat.
- Parental Leave Pay family-day text now follows the child’s birth-date band (110/120/130), with a claim-timing caveat.
- Household rebate results no longer show installation programs to renters or social housing occupants as straightforward leads. Duplicate energy directory cards and unrelated state grant-directory cards were removed. Property owners still receive conditional program leads.
- Business output identifies guided searches, rather than claiming program matches. The Tasmanian business link goes to Business Tasmania's current grant finder. Free text is escaped before display.
- Search requires all entered words; a search for the ended Energy Bill Relief Fund explains its end date and points to current assistance.
- The data-status panel links to each monitored source and explains that page monitoring is distinct from checking each rate, rule or individual grant. Manual checks and automated checks are labelled separately.
- Search-result guide cards can be opened with a keyboard. Corrected the Tasmanian electricity-concession link.

## Checks performed
- Existing core rule and batch-3 tests passed, including FTB boundaries and pension income/assets lower-of-tests.
- Syntax checks passed for JavaScript and Python.
- FTB A matrix generated for one through five children at annual incomes $69,131, $123,078, $148,507, $175,000, $200,000 and $220,000. For five under-13 children at $175,000, formula returned $163.32 per fortnight excluding supplements, rent assistance and other adjustments.
- Part B primary earner threshold and CCS 0/90% endpoints passed.
- Official-source spot checks: Services Australia FTB A/B, Low Income Health Care Card, Parental Leave Pay, business.gov.au finder, energy.gov.au rebate directory, Business Tasmania grant finder, and the Tasmanian electricity-concession listing.

## Outstanding before a claim of complete QA
- This updated package has not been deployed to the public URL or tested in a live browser after deployment.
- Every one of the 46 support-directory links, every state link, keyboard and mobile flows, and all grant open/closed statuses still require a production crawl and manual spot check. The source-status monitor checks pages, not individual program eligibility or funding.
- The short checker cannot determine every entitlement. Shared care, maintenance, residence, pension deeming, childcare fees/hours, and detailed business eligibility require an official assessment. Keep the conditional wording and official links visible.
