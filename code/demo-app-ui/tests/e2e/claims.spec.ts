import { test, expect } from './fixtures';
import { LoginPage } from './pages/login-page';

test('an unauthenticated visitor is redirected from claims to login', async ({ page }) => {
  await page.goto('/claims');
  await expect(page).toHaveURL(url => url.pathname === '/login');
  await expect(page.getByRole('heading', { name: 'Log In', exact: true })).toBeVisible();
});

test('incorrect credentials show a useful error without signing the user in', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.submit({ email: 'claimant@demo.com', password: 'IncorrectPassword123!' });
  await login.expectInvalidCredentials();
});

test('a negative claim amount prevents advancing past incident details', async ({ claimant, draft }) => {
  await claimant.startClaim();
  await claimant.enterIncident({ ...draft, claimAmount: '-100' });
  await claimant.expectValidation('Claim amount must be at least $0.01');
});

test('a description below the minimum length prevents advancing to review', async ({ claimant, draft }) => {
  await claimant.startClaim();
  await claimant.enterIncident(draft);
  await claimant.continue();
  await claimant.enterDescription('Short');
  await claimant.expectValidation('Description must be at least 10 characters');
});

test('a submitted claim can be reviewed by an administrator and its owner sees the saved status',
  async ({ claimant, admin, draft }) => {
    await test.step('claimant submits the claim through the browser', async () => {
      await claimant.startClaim();
      await claimant.enterIncident(draft);
      await claimant.continue();
      await claimant.enterDescription(draft.description);
      await claimant.continue();
    });
    const claimId = await claimant.submitReviewedClaim(draft.description);
    await test.step('administrator confirms the status change', async () => {
      await admin.moveToUnderReview(claimId);
    });
    await test.step('claimant reloads and sees the persisted status', async () => {
      await claimant.expectClaimStatus(draft.description, 'Under Review');
    });
  });
