# Playwright browser test guide

## Coverage
The reusable suite contains five independent browser tests:
1. Unauthenticated visitors are redirected from claims to login.
2. Incorrect credentials show an error without signing the user in.
3. Negative amounts prevent advancing past incident details.
4. Descriptions below the minimum length prevent advancing to review.
5. A claimant submits a claim, an administrator changes it to Under Review, and the claimant reloads and sees the saved status.

These tests use the normal running UI, BFF, Keycloak, Claims Service and database. Only test-user creation uses direct HTTP setup. Login, claim submission and administrator review use the browser. There are no route mocks or replaced responses. The final test checks saved state after reload, not WebSocket event delivery.

## Setup and execution
Start the Docker Compose application using RUN_GUIDE.md, including generation of the UI API client and matching BFF admin credentials. Then open PowerShell in code/demo-app-ui:

```powershell
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

The default is Playwright's downloaded Chromium. For installed Google Chrome instead:

```powershell
$env:BROWSER_CHANNEL = 'chrome'
npm.cmd run test:e2e
```

The verified run used installed Google Chrome in headless mode: five passed, zero failed, no retries, in 19.4 seconds. Downloaded Chromium and other browser channels have not been separately executed. Tests must run against an already running stack; they do not automatically start a dev server or reuse an unrelated process silently.

To view the report:

```powershell
npm.cmd run test:e2e:report
```

To run one test or see the browser:

```powershell
npm.cmd run test:e2e -- --grep 'negative claim amount'
npm.cmd run test:e2e -- --headed
```

BASE_URL defaults to http://localhost:3001; BFF_URL defaults to http://localhost:8090. ADMIN_EMAIL and ADMIN_PASSWORD override the supplied demo administrator. A desktop viewport is configured; mobile coverage is not claimed.

## Structure and engineering choices
- tests/e2e/claims.spec.ts contains short behavior-oriented specifications.
- tests/e2e/fixtures.ts provides unique claimant credentials, authenticated claimant and administrator sessions, and valid claim data.
- pages/login-page.ts owns login interactions and invalid-credential assertions.
- pages/claims-page.ts owns claim form interactions and observable claim assertions.
- pages/admin-claims-page.ts owns the administrator status-change workflow.
- playwright.config.ts owns execution settings and diagnostics, without the original missing global setup reference.

Shared fixtures prevent duplicated signup/login setup. Separate browser contexts prevent administrator and claimant cookies from mixing. Page objects expose small methods for user actions; tests express a single rule or coherent user journey. Assertions use accessible names, visible feedback and actual persisted results. Rejected input tests keep the normal validation enabled. The lifecycle journey observes a real submission response only to identify the created claim; it does not inject data into the UI or mock the server.

A claimant fixture waits for its initial real claims response before interaction, avoiding a hydration race without arbitrary sleeps. Unique short descriptions identify test claims without being truncated in the list. One worker limits contention on the development stack. Tests have no automatic retries, so failures remain visible. The reporter writes HTML and JUnit output, with retained failure traces and screenshots for the default test context. The separate administrator context is explicitly closed; automatic default-context diagnostics should not be assumed to capture every administrator action.

## Data and diagnostics
Each claimant-dependent test registers a unique qa-browser-...@example.com account. The full journey creates one claim and updates only that claim. Accounts and claims remain in the local demo database because there is no deletion API. Never rely on test execution order or another test's data.

Reports are under playwright-report/ and failure artifacts under test-results/, both ignored by Git. They are not required source files. The submission's test-results/playwright-results.xml is a saved verification result, not a substitute for a fresh run.

## Remaining limits
The known theme-test failures, API error-status defects, and existing TypeScript/lint findings are not fixed by adding browser tests. Full browser security testing, cross-browser/mobile behavior, CDC, load, visual regression, reconnect, concurrent administrator updates and real-time delivery remain outside this suite.
