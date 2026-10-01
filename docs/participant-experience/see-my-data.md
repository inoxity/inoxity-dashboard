# See My Data

**See My Data** is an optional participant-facing view that summarizes selected Apple Health information locally on the participant's device.

## Researcher configuration

The See My Data tab must be included in the configured visible tabs. The current app shows it only when HealthKit is enabled and at least one HealthKit identifier is selected.

## Separation from research uploads

See My Data and Study Backend synchronization are separate pipelines:

- summary cards query Apple Health locally;
- the displayed summary cards are not uploaded as summary records;
- configured raw/normalized HealthKit samples can still upload to the Study Backend through the sync pipeline;
- enabling a HealthKit identifier does not necessarily mean See My Data has a card for it.

For example, blood pressure can be configured for collection, but the current local summary service does not expose it because it is a HealthKit correlation rather than a simple quantity.

## Interpretation

See My Data is participant feedback, not a clinical dashboard or a substitute for source-data review. Researchers should not assume that a participant viewed a card or that its presentation matches an exported analytical dataset.
