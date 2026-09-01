# Participant onboarding

Onboarding is assembled from the current study configuration. Two studies can therefore present different sequences and request different information or permissions.

## Joining a study

1. The participant opens the iOS app and enters the supplied study code.
2. The app normalizes the code and asks the Control Backend to resolve it.
3. The app authenticates anonymously with the returned Study Backend and verifies its identity.
4. The participant completes configured onboarding steps.
5. The app registers an active enrollment and opens the main study interface.

An invalid, inactive, mismatched, or unavailable configuration/backend prevents enrollment.

## Possible onboarding steps

Depending on configuration, onboarding can contain:

- researcher-authored informational pages;
- participant identifier entry;
- selection of a participant-specific start date;
- wake and bed time entry;
- Apple Health rationale and authorization;
- notification rationale and authorization.

The app stores progress locally so an enrolled participant can return without starting over. Local state is scoped by study and versioned for migration.

## Permissions

iOS owns Apple Health and notification permissions. Researchers should explain why each permission is needed and what happens if it is declined. The app cannot bypass a denial, and some Apple Health read denials are deliberately indistinguishable from a lack of data.

## Researcher checklist

- Test the exact active configuration, not only bundled development fixtures.
- Use a physical iPhone for HealthKit and realistic notification testing.
- Verify participant-facing wording against approved consent and study materials.
- Confirm that the identifier format accepts realistic IDs without collecting unnecessary identity data.
