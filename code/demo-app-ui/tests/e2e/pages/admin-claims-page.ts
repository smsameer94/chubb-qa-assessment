import { expect, type Page } from '@playwright/test';

export class AdminClaimsPage {
  constructor(private readonly page: Page) {}

  async moveToUnderReview(claimId: string) {
    await this.page.goto('/admin/claims');
    const accessibleName = `Update status for claim ${claimId.substring(0, 8)}`;
    const select = this.page.getByRole('combobox', { name: accessibleName, exact: true });
    await select.selectOption('UNDER_REVIEW');
    await expect(this.page.getByRole('heading', { name: 'Confirm Status Change' })).toBeVisible();
    await this.page.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(this.page.getByText('Claim status updated to Under Review', { exact: true })).toBeVisible();
  }
}
