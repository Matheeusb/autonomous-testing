const request = require('supertest');
const app = require('../../src/app');
const config = require('./security.config');
const {
    getAdminToken,
    cleanDatabase,
    closeDatabase,
} = require('./helpers/auth');

describe('Security: Rate Limiting Tests', () => {
    let adminToken;

    beforeAll(async () => {
        adminToken = await getAdminToken();
    });

    afterAll(() => {
        cleanDatabase();
        closeDatabase();
    });

    // ─── Brute Force Login Prevention ───────────────────────────────────────

    describe('Brute force login prevention', () => {
        test('should handle rapid login attempts without crashing', async () => {
            const attempts = 20;
            const promises = [];

            for (let i = 0; i < attempts; i++) {
                promises.push(
                    request(app)
                        .post('/auth/login')
                        .send({ email: 'admin@example.com', password: `wrong-pass-${i}` })
                );
            }

            const responses = await Promise.all(promises);

            responses.forEach((response) => {
                // Should either return 401 (no rate limit) or 429 (rate limited)
                expect([401, 429]).toContain(response.status);
            });
        });

        test('should handle rapid requests to protected endpoints', async () => {
            const attempts = 30;
            const promises = [];

            for (let i = 0; i < attempts; i++) {
                promises.push(
                    request(app)
                        .get('/users')
                        .set('Authorization', `Bearer ${adminToken}`)
                );
            }

            const responses = await Promise.all(promises);

            responses.forEach((response) => {
                // Should either succeed (200) or rate limit (429)
                expect([200, 429]).toContain(response.status);
            });

            // Check if any rate limiting headers are present
            const lastResponse = responses[responses.length - 1];
            const hasRateLimitHeaders =
                lastResponse.headers['x-ratelimit-limit'] ||
                lastResponse.headers['x-ratelimit-remaining'] ||
                lastResponse.headers['retry-after'];

            // Log rate limiting status for CI awareness
            if (hasRateLimitHeaders) {
                expect(lastResponse.headers['x-ratelimit-limit']).toBeDefined();
            }
        });
    });

    // ─── Endpoint Flooding ──────────────────────────────────────────────────

    describe('Endpoint flooding resilience', () => {
        test('should handle concurrent user creation requests', async () => {
            const attempts = 10;
            const promises = [];

            for (let i = 0; i < attempts; i++) {
                promises.push(
                    request(app)
                        .post('/users')
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send({
                            name: `Flood User ${i}`,
                            email: `flood-${i}-${Date.now()}@test.com`,
                            age: 25,
                            password: 'securePass1!',
                        })
                );
            }

            const responses = await Promise.all(promises);

            responses.forEach((response) => {
                // Should either create (201) or rate limit (429), never crash (500)
                expect([201, 429]).toContain(response.status);
                // No password should be exposed
                if (response.status === 201) {
                    expect(response.body).not.toHaveProperty('password');
                }
            });
        });

        test('should handle rapid unauthenticated requests without crashing', async () => {
            const attempts = 50;
            const promises = [];

            for (let i = 0; i < attempts; i++) {
                promises.push(request(app).get('/users'));
            }

            const responses = await Promise.all(promises);

            responses.forEach((response) => {
                // Should return 401 (no token) or 429 (rate limited)
                expect([401, 429]).toContain(response.status);
            });
        });
    });
});
