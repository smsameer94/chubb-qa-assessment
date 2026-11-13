# AI working journal

## Disclosure
This journal is a retrospective summary of the chat and observed tool/test output. It is not a verbatim prompt transcript or a claim that notes were committed continuously during the session. AI performed most source review, test generation and documentation. The candidate executed Docker setup and backend test commands, reported manual behavior and supplied logs. The candidate must review the final work before submission; this document does not invent independent review, acceptance or overrides.

## Actual prompts and decisions
| User instruction or observation | AI contribution and outcome | What was accepted, challenged or corrected |
| --- | --- | --- |
| "analyze it first" | Read the brief and inspected the app; identified React/Next.js and existing tests despite the Angular/no-tests wording | AI challenged the brief's applicability to the supplied source; no implementation started at that stage |
| "am new to this" and startup failures | Guided Docker setup and builds; candidate executed commands | Candidate followed the setup flow and returned results; expertise is not inferred |
| Build failed with unknown lifecycle phase | Corrected PowerShell argument quoting | AI corrected its own original command |
| BFF could not find the sibling API specification | Mounted the whole code directory rather than only BFF | AI corrected its own Docker build instruction |
| Login repeatedly failed | Inspected logs; candidate confirmed Keycloak OOMKilled=true and increased Docker memory from roughly 2 GB to 6 GB | Replaced repeated restart-only troubleshooting with an evidence-based memory fix |
| Missing frontend generated module | Provided OpenAPI generation and website rebuild commands | Candidate reported the app working afterwards |
| Manual claim submission and admin status update | Suggested concrete steps; candidate confirmed success | These are candidate-reported manual checks, not AI-run browser tests |
| Negative amount, future date and short description checks | Candidate reported validation messages or blocked date selection | UI behavior only; not treated as proof of backend validation |
| Existing frontend failures | Inspected tests and implementation; found localStorage assertions against sessionStorage | Kept the mismatch visible; did not change product persistence policy without a requirement |
| Backend tests could not compile | Added missing event-publisher mock | Candidate ran the repaired suite and supplied its result |
| Repeated JaCoCo report corruption despite passing BFF tests | Inspected two-fork configuration, reduced to one fork | Candidate clean rerun confirmed 213 passes and successful report; concurrency cause remains an evidence-supported inference |
| "repairing the outdated Claims Service tests ... claim validation, permissions, and status updates" | Repaired event mocks and assertions; added boundary and lifecycle checks and stronger no-side-effect permission checks | Retained expected behavior; candidate output verified 240 passes and coverage report success |
| "add meaningful frontend component coverage ... integration coverage against real application services" | Added real component/store tests and real HTTP integration suite | Chose mocks only at component external boundaries; no service mocks in API integration |
| Integration signup returned 500 | Traced BFF admin-password default mismatch; direct token checks returned 401 for default and 200 for Compose credential | Added matching local Compose credentials; candidate recreated BFF; signup subsequently worked |
| Initial integration requests later returned 403 | Corrected API helper to track rotated CSRF cookies | AI corrected its own test harness; those spurious failures are not reported as product bugs |
| Existing description test timed out | Changed 950 keystrokes to a realistic paste action without weakening assertions | Rerun removed timeout-related failures; final full frontend suite retained only two theme failures |
| Real API tests returned 500 where contract requires 400/403 | Kept assertions and documented reproduction and observed no-side-effect behavior | Did not redefine expected results to match application defects |
| "prepare the Git commits, final strategy, AI journal, and walkthrough" | Imported pristine archive baseline and grouped changes into new commits; wrote these documents | History was constructed now from actual snapshots, not backdated to suggest earlier continuous commits |

## Human sign-off still needed
Read each test and defect description, run or inspect the documented commands, and be able to explain the trade-offs. No candidate challenge or override beyond what is recorded above is claimed. If sharing this journal, retain this disclosure rather than presenting AI reasoning as independently performed candidate review.

## Final verification and audit
At the user's request, AI reran frontend and real API suites, checked health endpoints, executed a Chrome browser journey using Playwright directly, and ran TypeScript, lint and Playwright discovery. The journey passed ten sequential checkpoints. Static checks and missing Playwright scaffolding were recorded, not repaired. Docker access prevented fresh Java runs in that pass. The final requirement audit and QA report were added to the package; prior backend results are identified as user-executed historical evidence.

## Requested Playwright addition
The user explicitly requested a reusable Playwright browser suite and stressed DRY, SOLID and Clean Code. AI replaced the incomplete configuration and added small page objects, independent tests and fixtures with unique accounts/separate sessions. Initial runs exposed test-harness assumptions: redirect query strings, interaction before the claims response, and list truncation of long descriptions. These were corrected without changing application behavior or adding sleeps. An obsolete initial worker was stopped after corrections; the final full suite passed all five tests on installed Chrome with zero retries in 19.4 seconds. Targeted ESLint passed and the TypeScript check reported no diagnostics in the new files; the existing seven diagnostics elsewhere remain. No human review of every test is inferred from the request. The suite and updated docs were committed after this verified run.
