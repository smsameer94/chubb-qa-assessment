import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { before, describe, it } from 'node:test';
import { ClaimsClient } from './helpers/claims-client.mjs';

const claimData = {
  incidentDate: '2026-01-01', incidentLocation: '123 Assessment Street',
  description: 'Assessment integration test vehicle collision', claimAmount: 500,
};
const password = 'Assessment123!';
const owner = new ClaimsClient();
const other = new ClaimsClient();
const admin = new ClaimsClient();
let ownerUser;

async function newClaim() {
  const response = await owner.request('/api/claims', { method: 'POST', body: claimData });
  assert.equal(response.status, 201, `Claim creation failed: ${JSON.stringify(response.data)}`);
  assert.match(response.data.claimId, /^[0-9a-f-]{36}$/i);
  return response.data;
}

async function claimStatus(claimId) {
  const response = await owner.request(`/api/claims/${claimId}`);
  assert.equal(response.status, 200);
  return response.data.status;
}

async function register(client, label) {
  const email = `qa-${label}-${randomUUID()}@example.com`;
  const response = await client.request('/api/auth/signup', {
    method: 'POST', body: { email, password, name: `Assessment ${label}` },
  });
  assert.equal(response.status, 201, `Signup failed: ${JSON.stringify(response.data)}`);
  return client.authenticate(email, password);
}

describe('Real BFF, Keycloak, Claims Service and database', { concurrency: false }, () => {
  before(async () => {
    const health = await owner.request('/actuator/health');
    assert.equal(health.status, 200, 'Start the Docker Compose stack before running this suite');
    ownerUser = await register(owner, 'owner');
    await register(other, 'other');
    await admin.authenticate(process.env.ADMIN_EMAIL || 'admin@demo.com', process.env.ADMIN_PASSWORD || 'Admin123!');
  });

  it('rejects unauthenticated claim reads', async () => {
    assert.equal((await new ClaimsClient().request('/api/claims')).status, 401);
  });

  it('persists submitted values and returns them on a separate owner read', async () => {
    const created = await newClaim();
    assert.equal(created.status, 'SUBMITTED');
    const fetched = await owner.request(`/api/claims/${created.claimId}`);
    assert.equal(fetched.status, 200);
    for (const [field, expected] of Object.entries(claimData)) assert.equal(fetched.data[field], expected, field);
    assert.equal(fetched.data.userId, ownerUser.userId);
    const list = await owner.request('/api/claims');
    assert.equal(list.status, 200);
    assert.ok(list.data.some(claim => claim.claimId === created.claimId));
  });

  it('denies another claimant direct access and excludes the claim from their list', async () => {
    const created = await newClaim();
    const denied = await other.request(`/api/claims/${created.claimId}`);
    const list = await other.request('/api/claims');
    assert.equal(list.status, 200);
    assert.ok(list.data.every(claim => claim.claimId !== created.claimId));
    assert.equal(denied.data?.claimId, undefined, 'Denied response must not contain the claim');
    assert.equal(denied.status, 403, JSON.stringify(denied.data));
  });

  it('rejects a claimant status change even with a valid CSRF token', async () => {
    const created = await newClaim();
    const response = await owner.request(`/api/admin/claims/${created.claimId}/status`, {
      method: 'PATCH', body: { newStatus: 'UNDER_REVIEW' },
    });
    assert.equal(response.status, 403);
    assert.equal(await claimStatus(created.claimId), 'SUBMITTED');
  });

  it('persists an administrator status change visible to the claimant', async () => {
    const created = await newClaim();
    const response = await admin.request(`/api/admin/claims/${created.claimId}/status`, {
      method: 'PATCH', body: { newStatus: 'UNDER_REVIEW' },
    });
    assert.equal(response.status, 200, JSON.stringify(response.data));
    assert.equal(response.data.status, 'UNDER_REVIEW');
    assert.equal(await claimStatus(created.claimId), 'UNDER_REVIEW');
  });

  it('rejects an invalid administrator transition without changing persisted status', async () => {
    const created = await newClaim();
    const response = await admin.request(`/api/admin/claims/${created.claimId}/status`, {
      method: 'PATCH', body: { newStatus: 'APPROVED' },
    });
    assert.equal(await claimStatus(created.claimId), 'SUBMITTED');
    assert.equal(response.status, 400, JSON.stringify(response.data));
  });

  const future = new Date();
  future.setUTCDate(future.getUTCDate() + 2);
  const invalidCases = [
    ['negative amount', { claimAmount: -1 }],
    ['amount above maximum', { claimAmount: 1000000.01 }],
    ['future incident date', { incidentDate: future.toISOString().slice(0, 10) }],
    ['short description', { description: 'Short' }],
  ];
  for (const [label, invalid] of invalidCases) {
  it(`rejects ${label} without creating a claim`, async () => {
    const initial = await owner.request('/api/claims');
    assert.equal(initial.status, 200);
      const response = await owner.request('/api/claims', { method: 'POST', body: { ...claimData, ...invalid } });
    const final = await owner.request('/api/claims');
    assert.equal(final.status, 200);
    assert.deepEqual(final.data.map(c => c.claimId).sort(), initial.data.map(c => c.claimId).sort());
    assert.equal(response.status, 400, `Invalid input ${JSON.stringify(invalid)}: ${JSON.stringify(response.data)}`);
  });
  }

  it('rejects an authenticated write without the CSRF header', async () => {
    const initial = await owner.request('/api/claims');
    assert.equal(initial.status, 200);
    assert.equal((await owner.request('/api/claims', { method: 'POST', body: claimData, csrf: false })).status, 403);
    const final = await owner.request('/api/claims');
    assert.equal(final.status, 200);
    assert.deepEqual(final.data.map(c => c.claimId).sort(), initial.data.map(c => c.claimId).sort());
  });
});
