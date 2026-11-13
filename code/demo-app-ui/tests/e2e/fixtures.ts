import { randomUUID } from 'node:crypto';
import { test as base, expect, type BrowserContext } from '@playwright/test';
import { LoginPage, type Credentials } from './pages/login-page';
import { ClaimsPage, type ClaimDraft } from './pages/claims-page';
import { AdminClaimsPage } from './pages/admin-claims-page';

type Fixtures = {
  claimantAccount: Credentials;
  claimant: ClaimsPage;
  admin: AdminClaimsPage;
  draft: ClaimDraft;
};

export const test = base.extend<Fixtures>({
  claimantAccount: async ({ playwright }, provide) => {
    const credentials = {
      email: `qa-browser-${randomUUID()}@example.com`,
      password: 'BrowserAssessment123!',
    };
    const client = await playwright.request.newContext({
      baseURL: process.env.BFF_URL || 'http://localhost:8090',
      timeout: 20_000,
    });
    try {
      const response = await client.post('/api/auth/signup', {
        data: { ...credentials, name: 'Browser assessment claimant' },
      });
      expect(response.status(), 'Test-account signup requires healthy BFF and Keycloak configuration').toBe(201);
    } finally {
      await client.dispose();
    }
    // Local test data is retained: the application provides no deletion API.
    await provide(credentials);
  },

  claimant: async ({ page, claimantAccount }, provide) => {
    const claimsLoaded = page.waitForResponse(response => new URL(response.url()).pathname === '/api/claims'
      && response.request().method() === 'GET');
    await new LoginPage(page).signIn(claimantAccount, '/claims');
    expect((await claimsLoaded).status()).toBe(200);
    await provide(new ClaimsPage(page));
  },

  admin: async ({ browser, baseURL }, provide) => {
    const context: BrowserContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
    try {
      const page = await context.newPage();
      await new LoginPage(page).signIn({
        email: process.env.ADMIN_EMAIL || 'admin@demo.com',
        password: process.env.ADMIN_PASSWORD || 'Admin123!',
      }, '/admin/dashboard');
      await provide(new AdminClaimsPage(page));
    } finally {
      await context.close();
    }
  },

  draft: async ({}, provide) => {
    await provide({
      incidentDate: '2026-01-01',
      incidentLocation: '123 Browser Assessment Street',
      claimAmount: '500',
      description: `Browser claim ${randomUUID().slice(0, 8)} collision`,
    });
  },
});

export { expect };
