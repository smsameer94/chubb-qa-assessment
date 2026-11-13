import { expect, type Page } from '@playwright/test';

export interface ClaimDraft {
  incidentDate: string;
  incidentLocation: string;
  claimAmount: string;
  description: string;
}

export class ClaimsPage {
  constructor(private readonly page: Page) {}

  async startClaim() {
    await this.page.getByRole('button', { name: 'Submit New Claim', exact: true }).click();
    await expect(this.page.getByRole('heading', { name: 'Incident Details', exact: true })).toBeVisible();
  }

  async enterIncident(draft: ClaimDraft) {
    await this.page.getByLabel(/When did the incident occur/).fill(draft.incidentDate);
    await this.page.getByLabel(/Where did the incident occur/).fill(draft.incidentLocation);
    await this.page.getByLabel('Claim Amount', { exact: false }).fill(draft.claimAmount);
    await this.page.getByLabel('Claim Amount', { exact: false }).blur();
  }

  async continue() {
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
  }

  async enterDescription(description: string) {
    const input = this.page.getByLabel(/Describe what happened/);
    await input.fill(description);
    await input.blur();
  }

  async expectValidation(message: string) {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  }

  async submitReviewedClaim(description: string): Promise<string> {
    const review = this.page.getByTestId('wizard-step-3');
    await expect(review.getByText(description, { exact: true })).toBeVisible();
    // Observe the real response; no route mocking or response replacement.
    const [response] = await Promise.all([
      this.page.waitForResponse(response => new URL(response.url()).pathname === '/api/claims'
        && response.request().method() === 'POST'),
      review.getByRole('button', { name: 'Submit Claim', exact: true }).click(),
    ]);
    expect(response.status(), 'Claim submission should be accepted').toBe(201);
    const claim: { claimId: string } = await response.json();
    expect(claim.claimId).toMatch(/^[0-9a-f-]{36}$/i);
    await expect(this.page).toHaveURL(/\/claims$/);
    await expect(this.page.getByRole('row').filter({ hasText: description })).toBeVisible();
    return claim.claimId;
  }

  async expectClaimStatus(description: string, status: string) {
    await this.page.reload();
    await expect(this.page.getByRole('row').filter({ hasText: description })).toContainText(status);
  }
}
