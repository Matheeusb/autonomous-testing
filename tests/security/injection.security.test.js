const request = require('supertest');
const app = require('../../src/app');
const config = require('./security.config');
const {
    getAdminToken,
    cleanDatabase,
    closeDatabase,
} = require('./helpers/auth');

describe('Security: Injection Tests', () => {
    let adminToken;

    beforeAll(async () => {
        adminToken = await getAdminToken();
    });

    afterAll(() => {
        cleanDatabase();
        closeDatabase();
    });

    // ─── SQL Injection ──────────────────────────────────────────────────────

    describe('SQL Injection', () => {
        describe('Login endpoint', () => {
            test.each(config.injectionPayloads.sql)(
                'should not be vulnerable to SQL injection in email: %s',
                async (payload) => {
                    const response = await request(app)
                        .post('/auth/login')
                        .send({ email: payload, password: 'password123' });

                    expect(response.status).not.toBe(200);
                    expect(response.body).not.toHaveProperty('token');
                    // Should not expose database errors
                    if (response.body.message) {
                        expect(response.body.message).not.toMatch(/sql|syntax|query|table|column|database/i);
                    }
                }
            );

            test.each(config.injectionPayloads.sql)(
                'should not be vulnerable to SQL injection in password: %s',
                async (payload) => {
                    const response = await request(app)
                        .post('/auth/login')
                        .send({ email: 'admin@example.com', password: payload });

                    expect(response.status).not.toBe(200);
                    expect(response.body).not.toHaveProperty('token');
                }
            );
        });

        describe('User creation endpoint', () => {
            test.each(config.injectionPayloads.sql)(
                'should not be vulnerable to SQL injection in name: %s',
                async (payload) => {
                    const response = await request(app)
                        .post('/users')
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send({
                            name: payload,
                            email: `injection-name-${Date.now()}@test.com`,
                            age: 25,
                            password: 'securePass1!',
                        });

                    // Should either succeed (treating payload as string) or fail with validation error
                    // Should NOT cause database errors or data leaks
                    if (response.status === 201) {
                        expect(response.body).not.toHaveProperty('password');
                    }
                    if (response.body.message) {
                        expect(response.body.message).not.toMatch(/sql|syntax|query|table|column|database/i);
                    }
                }
            );

            test.each(config.injectionPayloads.sql)(
                'should not be vulnerable to SQL injection in email: %s',
                async (payload) => {
                    const response = await request(app)
                        .post('/users')
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send({
                            name: 'Injection Test',
                            email: payload,
                            age: 25,
                            password: 'securePass1!',
                        });

                    // Should fail with validation error, not database error
                    expect(response.status).not.toBe(500);
                    if (response.body.message) {
                        expect(response.body.message).not.toMatch(/sql|syntax|query|table|column|database/i);
                    }
                }
            );
        });

        describe('User search/get by ID', () => {
            test.each(config.injectionPayloads.sql)(
                'should not be vulnerable to SQL injection in ID parameter: %s',
                async (payload) => {
                    const response = await request(app)
                        .get(`/users/${encodeURIComponent(payload)}`)
                        .set('Authorization', `Bearer ${adminToken}`);

                    expect([400, 404]).toContain(response.status);
                    if (response.body.message) {
                        expect(response.body.message).not.toMatch(/sql|syntax|query|table|column|database/i);
                    }
                }
            );
        });

        describe('User update endpoint', () => {
            test.each(config.injectionPayloads.sql)(
                'should not be vulnerable to SQL injection in update data: %s',
                async (payload) => {
                    const response = await request(app)
                        .put(`/users/${encodeURIComponent(payload)}`)
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send({ name: payload });

                    expect(response.status).not.toBe(200);
                    if (response.body.message) {
                        expect(response.body.message).not.toMatch(/sql|syntax|query|table|column|database/i);
                    }
                }
            );
        });

        describe('User delete endpoint', () => {
            test.each(config.injectionPayloads.sql)(
                'should not be vulnerable to SQL injection in delete ID: %s',
                async (payload) => {
                    const response = await request(app)
                        .delete(`/users/${encodeURIComponent(payload)}`)
                        .set('Authorization', `Bearer ${adminToken}`);

                    // Should return 404 for non-existent user, not cause DB error
                    expect(response.status).not.toBe(500);
                    if (response.body.message) {
                        expect(response.body.message).not.toMatch(/sql|syntax|query|table|column|database/i);
                    }
                }
            );
        });
    });

    // ─── NoSQL Injection ────────────────────────────────────────────────────

    describe('NoSQL Injection', () => {
        test.each(config.injectionPayloads.nosql)(
            'should not be vulnerable to NoSQL injection in login: %s',
            async (payload) => {
                const response = await request(app)
                    .post('/auth/login')
                    .send({ email: payload, password: payload });

                expect(response.status).not.toBe(200);
                expect(response.body).not.toHaveProperty('token');
            }
        );

        test('should handle object instead of string in email field', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: { $ne: null }, password: 'password' });

            expect(response.status).not.toBe(200);
            expect(response.body).not.toHaveProperty('token');
        });

        test('should handle object instead of string in password field', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'admin@example.com', password: { $ne: null } });

            expect(response.status).not.toBe(200);
            expect(response.body).not.toHaveProperty('token');
        });
    });

    // ─── Command Injection ──────────────────────────────────────────────────

    describe('Command Injection', () => {
        test.each(config.injectionPayloads.command)(
            'should not be vulnerable to command injection in user name: %s',
            async (payload) => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        name: payload,
                        email: `cmdinj-${Date.now()}@test.com`,
                        age: 25,
                        password: 'securePass1!',
                    });

                // Should either store as literal string or reject
                if (response.status === 201) {
                    expect(response.body.name).toBe(payload);
                    expect(response.body).not.toHaveProperty('password');
                }
            }
        );
    });

    // ─── XSS / Script Injection ─────────────────────────────────────────────

    describe('XSS / Script Injection', () => {
        test.each(config.injectionPayloads.xss)(
            'should handle XSS payload in user name: %s',
            async (payload) => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        name: payload,
                        email: `xss-${Date.now()}@test.com`,
                        age: 25,
                        password: 'securePass1!',
                    });

                // API should either sanitize/escape the input or store as literal string
                // Since this is a JSON API, XSS is less critical but should not cause errors
                expect(response.status).not.toBe(500);
            }
        );

        test.each(config.injectionPayloads.xss)(
            'should handle XSS payload in login email: %s',
            async (payload) => {
                const response = await request(app)
                    .post('/auth/login')
                    .send({ email: payload, password: 'password' });

                expect(response.status).not.toBe(200);
                expect(response.body).not.toHaveProperty('token');
            }
        );
    });

    // ─── Error Message Leakage ──────────────────────────────────────────────

    describe('Error message information leakage', () => {
        test('should not expose stack traces on server errors', async () => {
            const response = await request(app)
                .get('/users/undefined')
                .set('Authorization', `Bearer ${adminToken}`);

            const body = JSON.stringify(response.body);
            expect(body).not.toMatch(/at\s+\w+\s+\(/); // No stack traces
            expect(body).not.toMatch(/node_modules/);
            expect(body).not.toMatch(/\.js:\d+:\d+/); // No file references
        });

        test('should not expose database structure in errors', async () => {
            const response = await request(app)
                .get('/users/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`);

            const body = JSON.stringify(response.body);
            expect(body).not.toMatch(/CREATE TABLE|INTEGER PRIMARY|TEXT NOT NULL|UNIQUE|sqlite_master/i);
        });
    });
});
