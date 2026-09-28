# Finally Entitled — structured rules update

Upload these files to the repository root, replacing files with the same names:

- `rules-2026-27.js`
- `core-rules.test.js`
- `structured-rules-status.json` (new)

The existing GitHub workflow already conditionally runs `node core-rules.test.js`.

Important: this update deliberately separates calculator-rule verification from webpage availability. A 403/timeout never becomes a false green verification.

The rules file currently locks down the official 2026–27 core FTB Part A values and standard CCS income percentage rules. More payments should be added only after their official rules are verified and encoded with tests.
