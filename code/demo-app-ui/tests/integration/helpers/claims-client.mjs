import assert from 'node:assert/strict';

export class ClaimsClient {
  constructor(baseURL = process.env.BFF_URL || 'http://localhost:8090') {
    this.baseURL = baseURL;
    this.cookies = new Map();
    this.csrf = null;
  }

  async request(path, { method = 'GET', body, csrf = true } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.cookies.size) headers.Cookie = [...this.cookies].map(([key, value]) => `${key}=${value}`).join('; ');
    if (csrf && this.csrf && !['GET', 'HEAD'].includes(method)) headers[this.csrf.headerName] = this.csrf.token;
    const response = await fetch(new URL(path, this.baseURL), {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000), redirect: 'error',
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0];
      const index = pair.indexOf('=');
      this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    if (this.csrf && this.cookies.get('XSRF-TOKEN')) {
      this.csrf.token = decodeURIComponent(this.cookies.get('XSRF-TOKEN'));
    }
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data };
  }

  async authenticate(email, password) {
    const login = await this.request('/api/auth/login', { method: 'POST', body: { email, password } });
    assert.equal(login.status, 200, `Login failed with HTTP ${login.status}; check credentials and Keycloak health`);
    const csrf = await this.request('/api/auth/csrf');
    assert.equal(csrf.status, 200, 'CSRF endpoint failed');
    assert.equal(typeof csrf.data.token, 'string');
    this.csrf = csrf.data;
    return login.data;
  }
}
