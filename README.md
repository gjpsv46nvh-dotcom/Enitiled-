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
