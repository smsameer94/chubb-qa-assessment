# Test strategy

## Purpose and assessment interpretation
This assessment adds confidence in an insurance claims application under a limited time budget. The main risks are unauthorized claim access, incorrect claim amounts and validation, invalid lifecycle changes, and broken service boundaries. Coverage favors observable behavior and rejected requests with no side effects over increasing raw test counts.

The brief describes Angular and no existing tests. The supplied source is Next.js/React with Spring Boot services and substantial existing tests. The work therefore establishes the actual baseline, repairs obsolete test setup, adds selected missing coverage and records defects. Framework choices follow the supplied source.

## Application and risk model
The UI calls the BFF, which uses Keycloak for identity and Claims Service for business operations. Claims are stored in PostgreSQL. Kafka and WebSocket support real-time updates; Redis supports caching. Optional Debezium provides CDC.

| Priority | Risk | Selected evidence |
| --- | --- | --- |
| High | Another claimant accesses private claim data | Existing ownership unit tests and real authenticated cross-user API checks |
| High | A claimant changes administrator-only status | Stronger unit checks of no repository/event access, real HTTP 403 and unchanged status |
| High | Invalid amounts or malformed submissions reach storage | Boundary unit tests, API validation and before/after claim list comparisons |
| High | Invalid transitions corrupt state or emit events | All 25 state pairs, unchanged state/timestamp/event assertions, persisted status read after rejected API transition |
| High | Integration failures become misleading server errors | Real BFF-to-Claims-Service requests with contract status assertions |
| Medium | Failed or repeated submission loses work or creates duplicate requests | Component plus real wizard store, controlled API failure/pending/success outcomes |
| Medium | Kafka envelope routes an update incorrectly | Real JSON serialization with asserted event type, claim, recipient, correlation and status fields |
| Medium | Test infrastructure hides defects | Repaired mocks, real event capture, one test fork, reproducible commands |

## Test layers and rationale
Component tests use React Testing Library, user-event and Vitest. The new claim review tests keep the real component and wizard store; they mock the network boundary, navigation and toast. Assertions focus on visible retained data, disabled actions, submitted values and navigation after acceptance.

Unit tests use JUnit, Mockito and AssertJ/JUnit assertions. Existing domain and ownership tests remain, while new boundary cases and the lifecycle matrix add precise limits and side-effect checks. Kafka publisher tests serialize real JSON rather than relying on obsolete serialization mocks.

API integration tests use Node's built-in test runner and fetch. The client handles real authentication cookies and rotated CSRF tokens. Tests go through the normal BFF, Keycloak, Claims Service and PostgreSQL, without test-security profiles or service mocks. Fresh claimants isolate test data. Read-after-write confirms API-visible persistence.

## Verified results
| Suite | Result | Evidence source |
| --- | --- | --- |
| Claims Service selected non-integration suite | 240 passed, zero failed/errors/skipped; build and coverage report succeeded | User-executed Docker Maven output |
| BFF selected non-integration suite | 213 passed, zero failed/errors/skipped; build and coverage report succeeded | User-executed Docker Maven output |
| Full frontend suite | 267 passed, 2 failed out of 269 | AI-executed local Vitest run |
| New component tests | All 3 passed, including in the full suite | AI-executed local Vitest run |
| Real-service API integration suite | 8 passed, 3 failed out of 11; no skips/cancellations | AI-executed HTTP suite against local Docker services |

The remaining integration failures are incorrect HTTP status handling, not evidence that rejected requests persisted changes or disclosed another user's claim. The two frontend failures are a localStorage/sessionStorage test mismatch. See BUGS.md for detail. Results are a snapshot of the tested working tree; they are not a claim that every possible defect is covered.

## Deliberate exclusions
Browser end-to-end automation, Kafka/WebSocket delivery integration, CDC mode execution, restart durability, concurrent administrator changes, token expiry/refresh integration, load, visual regression and broad accessibility audits were left out. The API integration suite covers key service flows permitted by the brief, but it is not browser E2E. These exclusions keep the scope focused; no coverage percentage target is claimed.

The transition table follows current domain behavior, including UNDER_REVIEW returning to SUBMITTED. That edge has no independent business specification in the brief and should be confirmed with stakeholders. The tests do not establish that this product rule is correct merely because the implementation supports it.

## Next priorities
First fix and verify HTTP error mapping using the three retained regression failures. Next agree the intended theme persistence behavior and repair the mismatched tests. Add a browser submit/review flow and real Kafka-to-WebSocket delivery check, then investigate concurrent updates and reliable event publishing. Expand only when those checks are stable.

## Working record
The candidate performed setup commands and manual checks guided by AI, supplied backend logs, and requested test implementation. AI generated most code and notes. Candidate review and panel readiness are not assumed. AI_JOURNAL.md records actual interventions and corrections.

## Final verification addendum
The later QA verification also ran a real Chrome browser journey with ten sequential checkpoints passing, TypeScript with seven diagnostics, ESLint with 19 errors and 14 warnings, and Playwright discovery which failed on the missing setup file. This browser exploration does not supply a committed Playwright suite. See QA_REPORT.md and FINAL_AUDIT.md for complete scope and remaining obligations.
