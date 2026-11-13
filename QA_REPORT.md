# QA verification report

## Conclusion
The tested main browser journey works, but the application and test tooling still have issues. Three real API contract failures were reproduced, two existing frontend tests still fail, TypeScript and ESLint checks fail, and the supplied Playwright configuration cannot load its missing setup script. This is a broad verification pass, not exhaustive certification of the application.

## Latest execution results
| Check executed in this pass | Result |
| --- | --- |
| Full frontend Vitest suite | 269 total: 267 passed, 2 failed |
| Real BFF/Keycloak/Claims Service/database API suite | 11 total: 8 passed, 3 failed; no skips/cancellations |
| Browser exploration using Playwright with installed Chrome | 10 sequential checkpoints passed in one journey |
| Claims Service health endpoint | HTTP 200, UP |
| BFF health endpoint | HTTP 200, UP |
| Keycloak discovery endpoint | HTTP 200 |
| TypeScript no-emit check | Failed: 7 diagnostics |
| ESLint | Failed: 19 errors and 14 warnings |
| Supplied Playwright runner configuration, test discovery only | Failed to load missing tests/e2e/global-setup.ts |

Previously verified backend results: Claims Service 240 passed; BFF 213 passed, with successful coverage reports. Those were user-executed earlier runs, not fresh results from this pass. The current shell could not access Docker's executable or engine pipe; therefore Java suites and Testcontainers integration were not rerun here.

## Confirmed API defects

### Another claimant's record returns HTTP 500 instead of 403
A fresh claimant A creates a claim. Claimant B requests its ID using B's own authenticated session. Expected HTTP 403; actual HTTP 500. The response did not disclose the claim, and B's list excluded it. This is an error propagation defect, not a demonstrated privacy bypass. The BFF adapter converts downstream authorization errors into IllegalStateException.

### Invalid status transition returns HTTP 500 instead of 400
An administrator tries SUBMITTED to APPROVED directly. Expected HTTP 400; actual HTTP 500. A separate owner read confirmed that stored status stayed SUBMITTED. The rejected transition does not become a successful update, but the API misclassifies the business rejection as a server failure.

### Future incident date returns HTTP 500 instead of 400
A claimant submits an otherwise valid request dated two days in the future through the API, bypassing the UI restriction. Expected HTTP 400; actual HTTP 500. Before/after claim ID comparisons confirmed no claim was created. UI validation alone would not reveal this incorrect API status.

These assertions remain failing intentionally. Full request failures and assertion locations are in evidence/recheck-integration.log.

## Test and build quality issues

### Theme persistence mismatch
Two existing tests read localStorage under theme-storage; implementation writes sessionStorage. Both fail with null. The intended lifetime needs agreement before changing product behavior. The restoration test also merely reads data it wrote instead of exercising actual store hydration. Evidence: recheck-frontend.log.

### TypeScript check fails
Seven diagnostics were reported:
- beforeAll and afterAll are not declared/imported in error-boundary.test.tsx.
- Two assertions reference UserResponse.id, which is not part of the generated type.
- Production use-claim-realtime-handler.ts passes onClick to toast options even though the installed toast type does not support it.
- Two existing claim-wizard-store mocks provide date strings where generated ClaimResponse expects Date objects.

Passing Vitest runs do not establish TypeScript correctness because they do not replace a full type check. A production Next.js build was not run, so this report does not claim a reproduced production build failure. Evidence: recheck-types.log.

### ESLint fails
The run reported 19 errors and 14 warnings in existing application and test files. Examples include explicit any in tests/API middleware, state changes in an effect, a realtime reconnect callback referenced before its declaration, and a fixture callback named use being interpreted as a React Hook. These are static-rule findings, not individually reproduced runtime bugs. Evidence: recheck-lint.log.

### Supplied Playwright runner scaffold is incomplete
playwright.config.ts points globalSetup at tests/e2e/global-setup.ts, which is absent. Running test discovery fails with MODULE_NOT_FOUND. The exploratory browser script below used Playwright directly and does not repair or establish a functioning committed Playwright suite. Evidence: recheck-playwright.log.

## Browser checks that passed
The browser exploration used a fresh headless Chrome context, normal UI login, real services and no mocked network responses. It verified:
1. Protected claims page redirects an unauthenticated visitor to login.
2. An incorrect password produces an invalid-credentials message.
3. A claimant can log in and reach My Claims.
4. The incident date input has a maximum of today. This checks the input constraint, not every date-picker interaction.
5. A negative amount shows validation and disables Next.
6. A short description shows validation and disables Next.
7. Review shows the entered description.
8. Submission returns HTTP 201 and the created claim appears in the claimant list.
9. An administrator can change that claim to Under Review through the UI.
10. The claimant sees Under Review after reloading.

These are checkpoints in a single sequential exploratory script, not ten isolated automated tests. The run leaves one clearly labelled Browser assessment claim in the existing local demo claimant account, updated to UNDER_REVIEW. API runs also leave uniquely named qa-...@example.com users and their test claims, as documented in the integration notes. Initial browser-script attempts hit ambiguous locators; these harness errors were corrected and are not reported as application defects.

## Recommended order of work
First fix API exception-to-HTTP mapping and rerun the three retained regression tests. Next resolve the theme storage requirement and repair mismatched tests, then address TypeScript and lint findings. Complete the Playwright scaffold with an independent browser journey. Verify real Kafka-to-WebSocket updates, CDC configuration, concurrent status changes and event-delivery failure recovery afterwards.

## Coverage limits
No fresh Java, Testcontainers, load, visual, broad accessibility, multi-browser, token-expiry, real-time notification, CDC, concurrency or crash-recovery verification was performed in this pass. The UI container is the previously built snapshot, while frontend tests/static checks use the current host source. New frontend test-only edits do not alter the intended application behavior, but the two execution targets are not claimed to be byte-identical builds. No application code was repaired during this verification pass.

## Evidence commands
From code/demo-app-ui:

```powershell
npm.cmd test -- --configLoader native
npm.cmd run test:integration
npm.cmd run lint
node node_modules/typescript/bin/tsc --noEmit
node node_modules/@playwright/test/cli.js test --list
```

The first command uses Node 24's native config loader for this restricted Windows execution environment. All evidence files are saved beside this report. Review findings before representing the application or the entire suite as passing.

## Subsequent reusable browser suite verification
Following this report, the user requested reusable Playwright tests. The missing setup reference was removed and five independent tests were added with shared fixtures and page objects. The final complete run passed all five on installed Chrome without retries in 19.4 seconds. Targeted lint passed. No TypeScript diagnostics were reported in the new Playwright files; existing errors elsewhere remain. The prior missing-scaffold finding is resolved. Earlier report data remains a historical snapshot; API defects and theme/static issues are not claimed fixed. See PLAYWRIGHT_GUIDE.md and saved test-results/playwright-results.xml.
