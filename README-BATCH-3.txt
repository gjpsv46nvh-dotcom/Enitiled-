FINALLY ENTITLED — BATCH 3

Upload these 2 files to the ROOT of the GitHub repo:
- rules-batch-3-2026-27.js
- core-rules-batch-3.test.js

IMPORTANT:
This is additive and does not replace Batch 2.
The website must load rules-batch-3-2026-27.js AFTER rules-2026-27.js.

To make GitHub Actions test it, add this command after the existing core rule test:
  node core-rules-batch-3.test.js

Batch 3 covers:
- Age Pension core current rate/assets bands
- DSP current rates and selected income cutoffs
- Carer Payment current rates/income/assets
- Parental Leave Pay 2026-27 rate, days, income/work-test values
- Newborn Upfront Payment & Newborn Supplement
- Stillborn Baby Payment

Carer Allowance and concession-card logic are intentionally NOT guessed into this batch; add them after separate official-rule verification.
