# Bugs reproduced by real service integration tests

## Setup defect fixed in local Compose configuration
Signup returned HTTP 500 when the BFF attempted Keycloak administrative operations. The BFF default administrator password was admin, while the infrastructure bootstrap password is Admin123!. Direct master-realm token requests returned HTTP 401 and HTTP 200 respectively. The BFF Compose environment now explicitly matches the existing demo administrator credentials. After the user recreated the BFF, two unique claimants could be registered and authenticated successfully. This is a local configuration fix, not a change to application authorization logic.

## Incorrect HTTP status for another claimant's claim
Reproduction: register claimants A and B, authenticate both, create a claim as A, GET /api/claims/{claimId} as B using B's own session.
Expected: HTTP 403, matching the API contract and Claims Service forbidden mapping.
Actual: HTTP 500 from the BFF. The response did not return the claim, and B's list excluded it. This is incorrect error handling, not demonstrated unauthorized disclosure.
Source review: ClaimsServiceAdapter.getClaim converts a downstream 403 into IllegalStateException, losing its HTTP meaning.
Automated evidence: denies another claimant direct access and excludes the claim from their list.

## Incorrect HTTP status for an invalid administrator transition
Reproduction: create a new SUBMITTED claim, then PATCH /api/admin/claims/{claimId}/status as an administrator with {"newStatus":"APPROVED"}.
Expected: HTTP 400 for the disallowed direct transition, and unchanged stored status.
Actual: HTTP 500; a separate claimant read confirmed the stored status remained SUBMITTED.
Source review: InvalidStatusTransitionException extends DomainException and has no explicit handler in ClaimExceptionHandler. The precise complete propagation path has not been traced with container logs.
Automated evidence: rejects an invalid administrator transition without changing persisted status.

## Incorrect HTTP status for a future incident date
Reproduction: submit a claim through POST /api/claims with a valid claimant session and CSRF header, valid amount/location/description, and an incident date two days in the future.
Expected: HTTP 400 with validation feedback and no claim created.
Actual: HTTP 500; before/after claim ID lists confirmed no claim was created.
Source review: the domain rejects future dates, but ClaimsServiceAdapter.submitClaim wraps downstream ApiException as IllegalStateException. This explains loss of the downstream validation response at the BFF.
Automated evidence: rejects future incident date without creating a claim.

## Verified run
Final integration run: 11 tests, 8 passed, 3 failed, zero skipped/cancelled. It used real HTTP calls to the local BFF with Keycloak, Claims Service and PostgreSQL running. The three failing assertions retain the expected contract status codes; no expected failures or mocks hide them. Successful checks include persisted claim fields, owner reads/list, claimant denial of administrator updates, administrator status change, invalid amount/description rejection without persistence, unauthenticated denial, and CSRF protection.

No application error handlers were changed in this assessment step. These failures are reproducible evidence for discussion with the panel. API tests do not cover browser behavior or real-time notification delivery.
