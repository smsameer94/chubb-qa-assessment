# Claims Service testing notes

## Scope and priority
Protect claim data and authorization boundaries first. Invalid submissions must not be saved or published. Claimants must not update statuses, and missing users must not reach claim repositories. Rejected lifecycle transitions must not mutate claims or emit events. Correct routing fields in Kafka messages matter because the BFF uses them to deliver notifications.

## Repairs
- Supplied the missing mocked ApplicationEventPublisher to status-update and claim-creation tests.
- Replaced the obsolete assertion that a published creation event remains queued with checks of the captured published event and cleared queue.
- Reworked Kafka publisher tests to serialize real envelopes and assert payload fields; mocks now represent only external dependencies and deliberate serialization failure.
- Configured one test fork, matching the BFF workaround verified by the user's clean test run. Claims Service coverage generation also succeeded in the subsequent user-executed clean run.

## Added or strengthened checks
- Amount boundaries 0.01 and 1000000 accepted; zero, negative, and above-maximum rejected.
- Description lengths 10 and 1000 accepted; 9 and 1001 rejected; whitespace excluded from minimum length.
- Location lengths 5 and 200 accepted; 4 and 201 rejected.
- All 25 pairs of lifecycle states checked against an explicit permitted transition table.
- Rejected transitions preserve state, timestamp, and event queue.
- Invalid submissions cannot save, publish, or increment the submitted metric.
- CDC submission mode saves without publishing a direct event.
- Non-admin or missing users cannot access the claim repository or publish status changes.
- Successful status updates publish the correct claim ID and before/after statuses.
- Existing owner-versus-other-user retrieval tests remain in place.
- Validator and serialization failures cannot send Kafka messages.

## Limits
These are isolated unit tests. They do not prove HTTP security, real database persistence, Kafka delivery, transaction commit behavior, CDC execution, or browser functionality. Component and integration coverage remain separate assessment work. The permitted lifecycle table follows current source behavior, including UNDER_REVIEW returning to SUBMITTED; the brief supplies no independent business specification for that edge.

## Verification status
Before these edits, the user ran 197 Claims Service tests: 3 failures and 6 errors. The user subsequently executed the clean test command with integration-tagged tests excluded: 240 tests ran, 0 failures, 0 errors, 0 skipped; JaCoCo analyzed 57 classes and the build succeeded. Evidence: user-supplied Maven output finished 2026-11-13T16:04:50Z. This confirms the selected suite, not real infrastructure integration.

## AI collaboration record for this change
The user requested repairs plus validation, permission, and status coverage. AI inspected the existing source/tests, replaced obsolete event mocks and assertions, and added boundary and lifecycle checks. Application behavior was not changed. The user executed the updated suite and supplied the passing output. No broader human acceptance or override is claimed.
