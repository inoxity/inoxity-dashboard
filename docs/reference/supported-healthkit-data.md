# Supported Apple Health data

The dashboard (configuration schema version {{ schema_version }}) and the current iOS app support the {{ healthkit_type_count }} Apple Health data types below. Availability still depends on the participant's device, iOS/HealthKit support, recorded data, and granted permission.

Each type is stored in its own table in your Study Backend. Every table has the same columns (see [Apple Health sample tables](../data/data-access.md#apple-health-sample-tables)) plus the value column listed here.

!!! info "Generated from the code"
    These tables are generated from Inoxity's current code every time these docs are built, so a newly supported type appears here automatically.

--8<-- "generated/healthkit/categories.md"

## Exclusions and special cases

Clinical Records and Health Documents are excluded because they require authorization beyond the standard read flow implemented here. ECG and audiograms are excluded because their waveform structures do not fit the normalized sample pipeline.

Most category types store Apple's raw integer enum value. Sleep analysis retains a friendly state representation. Blood pressure is stored as a correlation and is not currently displayed in See My Data.

!!! warning
    A type's technical availability is not permission to collect it. Select only data covered by the study's protocol, consent, privacy disclosures, and governance approvals.
