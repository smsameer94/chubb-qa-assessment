import { expect, type Page } from '@playwright/test';

export interface Credentials {
  email: string;
  password: string;
}

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/login');
  }

  async submit(credentials: Credentials) {
    await this.page.getByLabel('Email', { exact: true }).fill(credentials.email);
    await this.page.getByLabel('Password', { exact: true }).fill(credentials.password);
    await this.page.getByRole('button', { name: 'Log In', exact: true }).click();
  }

  async signIn(credentials: Credentials, destination: '/claims' | '/admin/dashboard') {
    await this.open();
    await this.submit(credentials);
    await expect(this.page).toHaveURL(new RegExp(`${destination}$`));
  }

  async expectInvalidCredentials() {
    await expect(this.page.getByRole('alert').filter({ hasText: 'Invalid email or password' }))
      .toHaveText('Invalid email or password');
    await expect(this.page).toHaveURL(/\/login$/);
  }
}
