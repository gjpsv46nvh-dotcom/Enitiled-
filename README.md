# Finally Entitled V4

V4 separates the result experience into two layers.

## Main matches
The common/high-value support most relevant to the household profile, such as:
- Family Tax Benefit Part A
- Child Care Subsidy
- Rent Assistance
- Parenting Payment
- JobSeeker
- Student support
- Carer support
- Disability support
- Age Pension

## "You may also be entitled to..."
A separate discovery area for less-obvious support so it does not clutter the main results:
- FTB Part B
- Health and concession cards
- New baby support
- Additional Child Care Subsidy
- Carer Allowance and supplements
- Disability/mobility-related assistance
- Education supplements/help
- State/territory concessions and cost-of-living programs

The UI remains intentionally simple. The long-term production engine should maintain a date-versioned official catalogue and only ask extra questions when a possible entitlement requires them.

Rules basis: September 2026.

## V4.1 functional QA fixes
- Fixed single users incorrectly retaining default partner income.
- Partner income input now hides for single users.
- Rent input now hides and clears when not renting.
- Fixed profile progress count (3 steps).
- Income modelling slider expanded to $600,000.
- Brand/home link now uses the app navigation.
- Tightened CCS child screening for secondary-school status.
- FTB Part A no longer displays a maximum-rate amount as a calculated entitlement above the maximum-rate income threshold.
- CCS result wording now makes clear it is an income-based percentage estimate, not a dollar payment.

## V5 Search Support
- Adds a separate Search Support route without complicating the eligibility questionnaire.
- Search by official payment name or everyday phrases.
- Browse Commonwealth support by family, work, study, carers, disability, older Australians, concessions, housing/supplements and special circumstances.
- Each item opens a simple on-site guide: what it is, who may qualify, amount/rate explanation, what may be needed, and how to apply.
- Keeps only one official government information/apply link at the bottom of each guide.
- Catalogue baseline checked against the Services Australia Guide to Australian Government Payments, 20 September 2026.
- Business & Grants remains a separate pathway because live grant rounds change frequently.

Production note: state/territory and council catalogues should be maintained as a separate jurisdiction data layer so changing rebates and concessions can be updated without changing the simple UI.

## V6 Energy, solar and state-aware support
- Added state/territory filtering to Search Support.
- Added a dedicated Energy & solar category.
- Added national rooftop-solar SRES support, Cheaper Home Batteries, Household Energy Upgrades Fund and SunSPOT.
- Added current major state/territory solar, battery, electrification and energy-support programs.
- Added search terms for solar, batteries, power bills, electricity concessions, hot water, insulation, VPPs and related upgrades.
- Added the official Australian Government energy rebate finder as the broad current-program backstop, because state and council programs open/close frequently.
- State-specific results are hidden when another state is selected.
- The main eligibility questionnaire remains unchanged and simple.

Important: program availability and amounts can change. Production should periodically refresh the energy catalogue from official federal/state sources rather than hard-code assumptions indefinitely.

## V7 State & Territory layer
- Added a dedicated State support category for all 8 jurisdictions.
- The household's selected state now automatically filters Search Support.
- Eligibility results automatically add a simple state-specific support/concessions check.
- State layer covers the gateway to utilities, water/rates, transport/registration, health/ambulance, education and other cost-of-living concessions without adding more questions.
- Energy & solar remains a detailed sub-layer alongside general state support.
- Commonwealth, state/territory and energy support now use the same search experience.

Design rule: users choose their state once. Finally Entitled handles jurisdiction filtering behind the scenes.

## V7.1 first-time-user QA
- Simplified top navigation to Home, Check eligibility, Search support and Business support.
- Made Search support a first-class homepage action.
- Removed arbitrary pre-filled DOBs and partner income that could create misleading results.
- Changed the main result CTA to “See what I may qualify for”.
- Added a short trust line explaining this is a free pre-application check.
- Made support search more forgiving for everyday multi-word searches.
- Improved the state-support shortcut.
- Retained income modelling inside the guided eligibility journey instead of advertising it as a separate product.

## V8 automatic government-data freshness framework
- Added a green `Government data up to date` indicator with the last successful check date.
- Tapping it opens source-by-source status and distinguishes `checked` from `rules last changed`.
- Added `data-status.json`, loaded without browser cache.
- Added a safe official-source checker under `scripts/check-government-sources.py`.
- Added a daily GitHub Actions workflow under `.github/workflows/check-government-data.yml`.
- If an official source changes, the indicator turns amber/review-needed; existing entitlement calculation rules are NOT silently overwritten.
- If a source check fails, the green status is removed rather than displaying a false assurance.
- Initial monitored sources: Services Australia payment guide, energy.gov.au rebates, Tasmanian Government concessions.

Production next step: expand the monitored-source registry to every state/territory source and add structured rule parsers/tests for major calculations. Only validated structured changes should be promoted into live calculation rules.

## V8.1 user QA fixes
- Removed the hidden preset 2022 DOB from newly added children.
- Removed sample $40/hour and 38-hours/week values so a new visitor is not given a fictional household income.
- Added a clear note that $0 income is treated as an intentional value.
- Search results are now relevance-ranked while retaining forgiving plain-English matching.
- Search detail closes when the query/filter changes, preventing stale entitlement information remaining below new results.
- Green status now says `Monitored government sources up to date`, avoiding the false impression that every Australian government program is already monitored.
- Changed rules wording to `Calculation rules currently validated to`.

## V8.2 second user QA pass
- Added required-field checks for date of birth, state/territory, partner DOB when partnered, and every child row.
- Prevents age/state-based screening from quietly running on missing profile data.
- Added a friendly inline validation notice rather than relying on browser error bubbles.
- Expanded the automatic source-monitor registry from Commonwealth/energy/Tasmania to all 8 state and territory government support gateways.
- Status panel now states how many official sources were checked.
- Kept fail-safe behaviour: detected page changes are review flags, not automatic calculator-rule rewrites.
- Improved income slider synchronisation after pay inputs change.
- Confirmed current Services Australia guide is dated 20 September 2026 and energy.gov.au continues to aggregate federal/state/territory assistance.
