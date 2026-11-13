# Frontend component and real service integration testing

## What was added
Three Testing Library component tests render the real claim review component and its real Zustand store, mocking only the API boundary, router and toast output. They verify that a failed submission preserves the visible draft and supports retry, pending submission disables repeated submission and Back, and reviewed values are sent before navigation. The API is mocked here because these tests isolate frontend behavior.

Eleven Node built-in test cases exercise actual HTTP endpoints on the normal Docker Compose BFF. They use real Keycloak logins, CSRF cookies and headers, Claims Service calls and database-backed read-after-write checks. No authentication bypass, mocked services or test security profiles are used. Cases cover unauthenticated reads, persisted claim fields, cross-claimant isolation, forbidden claimant status updates, permitted admin updates, invalid transitions, invalid submissions and missing CSRF protection.

## Run
Start the infrastructure and applications as described in the root README. After changing Compose environment settings, recreate the BFF:

```powershell
docker compose -f docker-compose.apps.yml up -d --no-deps --force-recreate bff-service
```

From code/demo-app-ui:

```powershell
npm ci
npm test -- src/features/claims/components/wizard-step-3.behavior.test.tsx
npm run test:integration
```

Node 20 or newer is needed for the integration runner; it has no additional dependencies. BFF_URL defaults to http://localhost:8090. ADMIN_EMAIL and ADMIN_PASSWORD may override the supplied local demo administrator account. On Node 24, `npm test -- --configLoader native ...` is also available if config bundling is restricted by the execution environment.

For an isolated integration run from the repository root with Docker:

```powershell
docker run --rm --network demo-network -e BFF_URL=http://bff-service:8090 -v "${PWD}/code/demo-app-ui:/workspace:ro" -w /workspace node:20-alpine node --test --test-concurrency=1 tests/integration/claims-api.integration.mjs
```

## Test data
Each integration run registers two uniquely named qa-...@example.com claimants. Test claims belong to those new accounts; the suite does not modify existing users' claims. Accounts and claims remain in the local demo database because no deletion API is provided. Unique accounts avoid collisions across repeat runs. Run only against the assessment's local environment.

## Findings
Signup initially returned HTTP 500. Source inspection found that the BFF defaults KEYCLOAK_ADMIN_PASSWORD to admin, whereas infrastructure creates the Keycloak bootstrap administrator with Admin123!. Direct token-endpoint checks returned HTTP 401 for the BFF default and HTTP 200 for the Compose credential. The applications Compose file now explicitly passes matching local administrator credentials to the BFF. The user recreated the running container and subsequent signup/login setup succeeded.

The existing long-description counter test typed 950 individual keystrokes and exceeded its timeout, allowing unfinished work to interfere with subsequent tests. It now uses a user paste action; the 22 tests in that file subsequently passed together with the three added tests. Assertions and application behavior are unchanged.

The existing two theme persistence tests still read localStorage while the implementation uses sessionStorage. This mismatch remains documented, not silently hidden by changing application behavior. Existing React act warnings also remain outside this focused change.

## Validation and limits
- Three new component tests passed in a direct run.
- The description component suite plus new tests passed: 25 tests, zero failures.
- Before the paste adjustment, a full frontend run reported 261 passed and 8 failed: two theme failures and six description failures associated with the timeout. After the paste adjustment, a full rerun reported 267 passed and 2 failed out of 269 tests; only the known theme storage mismatch remains.
- After the user recreated the BFF, the final real-service run executed 11 tests: 8 passed, 3 failed, none skipped or cancelled. The remaining failures expose HTTP error mapping defects documented in INTEGRATION_BUGS.md. They remain failing intentionally.
- API integration is not browser end-to-end coverage. It does not verify rendering, Kafka delivery, WebSocket receipt, CDC or crash recovery. Read-after-write proves API-visible persisted behavior, not resilience across database restarts.

## AI working record
The user asked for meaningful frontend component and real-service integration coverage. AI inspected the existing tests, chose the real component/store rather than mocking the store, authored the HTTP client and eleven integration cases, ran component tests, detected the signup failure and traced the credential mismatch. The user executed the requested BFF recreation; AI then ran the real-service suite and documented its results. No user acceptance or review of the generated tests is claimed.


The API helper was corrected during test development to track rotated XSRF-TOKEN cookies after each response. Stale test-client CSRF headers initially caused spurious HTTP 403 responses; this was a test harness defect, not an application finding.

## Browser coverage subsequently added
Five independent Playwright tests are now committed and passed on installed Chrome. Shared fixtures register unique claimants and isolate sessions; page objects own login, claimant and administrator interactions. See PLAYWRIGHT_GUIDE.md. The earlier API-only coverage limit describes the previous state, not the current suite. Real-time event delivery remains untested.
