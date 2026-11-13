# Walkthrough preparation

## Presentation plan for 15 to 20 minutes
| Time | Topic | What to show |
| --- | --- | --- |
| 0–2 min | Scope and risks | Explain that the actual app is React with existing tests; prioritize privacy, claim rules and integration boundaries |
| 2–5 min | Backend checks | Show amount/text boundaries, the lifecycle matrix and no-side-effect permission assertions |
| 5–8 min | Component behavior | Run the three claim review tests; explain real store plus mocked API boundary |
| 8–13 min | Real services and findings | Run the integration suite; show 8 passes and 3 reproducible error-status defects |
| 13–16 min | Engineering and AI | Show logical commits, journal, corrected test harness mistakes and coverage configuration |
| 16–20 min | Limits and next work | Explain two theme failures, missing browser/messaging coverage and prioritized next steps |

## Suggested opening in your own words
The highest risks I chose were claim privacy, authorization and valid status changes. The package differed from the brief: it used React and already had tests. I first established a baseline, repaired obsolete test setup, then used AI to add focused unit, component and real API integration tests. I ran commands and reviewed results with AI. The integration suite found three places where business rejections become HTTP 500 responses. Those tests remain failing as evidence.

Use this as a guide, not a claim that you performed steps you did not. Explain the AI contribution directly and adjust wording to what you understand and have reviewed.

## Live demo
1. Start with TEST_STRATEGY.md and the results table. Do not claim all suites are green.
2. Show ClaimBoundaryTest and explain just-below/at/above limits.
3. Show one denied administrator action: repositories and event publisher must not be called.
4. Show ClaimLifecycleTest: 25 state pairs, seven allowed transitions, rejected transitions leave state unchanged.
5. Run the new component file using RUN_GUIDE.md. Explain that preserving a draft and allowing retry matters after server failure.
6. Run the integration suite. It creates unique test users and leaves their local test data in place. Expected outcome is eight passes and three failures, not a zero exit code.
7. Show the future-date failure: UI prevents selection, but a direct API request must still be validated. The rejected request creates no claim, yet its status is incorrectly 500.
8. Show BUGS.md and one underlying exception mapping. Explain that an error-status defect is different from a demonstrated data leak.
9. Show git log --oneline and AI_JOURNAL.md. State that commits were grouped after implementation and are not a continuous timestamped session log.

## Questions to practice
**Why are some tests failing?** Three integration assertions preserve the correct HTTP contract and expose real defects. Two older frontend tests check the wrong storage area. Making the suite green by accepting wrong behavior would hide those findings.

**Are these integration tests end to end?** They cross real service and database boundaries through HTTP. They do not operate a browser or verify UI rendering or event delivery.

**Why not test everything?** Authorization, persisted correctness and lifecycle rules were prioritized. Load and visual testing would add less confidence than closing those risks first in the available assessment window.

**Why mock the API in component tests?** To control pending, failure and success outcomes while keeping the real component/store interaction. Real API behavior is exercised separately.

**Why retain the theme mismatch?** The code uses sessionStorage while tests expect localStorage. The intended lifetime needs agreement; a refresh check alone cannot establish persistence across browser sessions.

**Does using one test fork prove the corruption cause?** No. Clean runs with two forks repeatedly failed report reading; a one-fork clean run succeeded. It is a practical workaround supported by the observed runs, with further investigation left open.

**What did AI get wrong?** PowerShell quoting, the initial BFF volume mount and stale CSRF-token handling needed correction. The journal records those corrections instead of hiding them.

**What would you do next?** Fix error propagation with the existing failing tests, resolve theme requirements, add a browser journey and real Kafka/WebSocket check, then investigate concurrency and durable event delivery.

## Before meeting the panel
- Read every added test and explain its setup, action and assertion without reading generated prose aloud.
- Practice one successful run and one defect demonstration.
- Confirm Docker has sufficient memory and all required services are healthy.
- Know the distinction between mocks, API integration and browser E2E.
- Review the generated code and say honestly if a design choice was AI-proposed.
- Ask the recruiter for submission instructions and whether setup time counts toward the assessment cap; the brief leaves submission details TBD.

## Updated browser demonstration
The reusable suite is now present. Use PLAYWRIGHT_GUIDE.md to run npm.cmd run test:e2e from code/demo-app-ui after starting the stack. Demonstrate the fifth test: fresh claimant submits, administrator confirms Under Review, claimant reloads and sees the status. Show the shared account/session fixtures and the three page objects to explain DRY and separation of responsibilities. Five tests passed on Chrome. Earlier answers describing missing browser automation are superseded; API regression failures and remaining exclusions still apply. Keep the presentation within its existing time allocation by shortening other demos.
