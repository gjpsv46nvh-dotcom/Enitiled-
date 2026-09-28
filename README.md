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
