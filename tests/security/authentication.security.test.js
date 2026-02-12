const request = require('supertest');
const app = require('../../src/app');
const {
    getAdminToken,
    generateExpiredToken,
    generateInvalidSecretToken,
    cleanDatabase,
    closeDatabase,
} = require('./helpers/auth');

describe('Security: Authentication Tests', () => {
    let adminToken;

    beforeAll(async () => {
        adminToken = await getAdminToken();
    });

    afterAll(() => {
        cleanDatabase();
        closeDatabase();
    });

    // ─── Access Without Token ────────────────────────────────────────────────

    describe('Access without token (401)', () => {
        const protectedEndpoints = [
            { method: 'get', path: '/users' },
            { method: 'get', path: '/users/some-id' },
            { method: 'post', path: '/users' },
            { method: 'put', path: '/users/some-id' },
            { method: 'delete', path: '/users/some-id' },
        ];

        test.each(protectedEndpoints)(
            'should return 401 for $method $path without token',
            async ({ method, path }) => {
                const response = await request(app)[method](path).send({});
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('message');
            }
        );
    });

    // ─── Invalid Token ──────────────────────────────────────────────────────

    describe('Invalid token (401)', () => {
        const invalidTokens = [
            { description: 'completely invalid string', token: 'not-a-valid-token' },
            { description: 'random base64 string', token: 'eyJhbGciOiJIUzI1NiJ9.invalid.payload' },
            { description: 'empty string', token: '' },
            { description: 'numeric value', token: '12345' },
            { description: 'special characters', token: '!@#$%^&*()' },
        ];

        test.each(invalidTokens)(
            'should return 401 for $description',
            async ({ token }) => {
                const response = await request(app)
                    .get('/users')
                    .set('Authorization', `Bearer ${token}`);
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('message');
            }
        );
    });

    // ─── Expired Token ──────────────────────────────────────────────────────

    describe('Expired token (401)', () => {
        test('should return 401 for expired token', async () => {
            const expiredToken = generateExpiredToken();
            // Small delay to ensure token is expired
            await new Promise((resolve) => setTimeout(resolve, 1100));

            const response = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${expiredToken}`);
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message');
        });
    });

    // ─── Malformed Authorization Header ─────────────────────────────────────

    describe('Malformed Authorization header', () => {
        test('should reject missing Bearer prefix', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', adminToken);
            expect(response.status).toBe(401);
        });

        test('should reject Basic scheme instead of Bearer', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', `Basic ${adminToken}`);
            expect(response.status).toBe(401);
        });

        test('should reject lowercase bearer', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', `bearer ${adminToken}`);
            expect(response.status).toBe(401);
        });

        test('should reject extra spaces', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', `Bearer  ${adminToken}`);
            expect(response.status).toBe(401);
        });

        test('should reject only Bearer keyword', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Bearer');
            expect(response.status).toBe(401);
        });

        test('should reject Bearer with space only', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Bearer ');
            expect(response.status).toBe(401);
        });
    });

    // ─── Token Signed With Wrong Secret ─────────────────────────────────────

    describe('Token signed with wrong secret', () => {
        test('should return 401 for token signed with different secret', async () => {
            const invalidToken = generateInvalidSecretToken();
            const response = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${invalidToken}`);
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message');
        });

        test('should not grant admin access with forged token', async () => {
            const forgedToken = generateInvalidSecretToken();
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${forgedToken}`)
                .send({
                    name: 'Hacker',
                    email: 'hacker@evil.com',
                    age: 25,
                    password: 'hackerPass1!',
                });
            expect(response.status).toBe(401);
        });
    });

    // ─── Login Endpoint Security ────────────────────────────────────────────

    describe('Login endpoint security', () => {
        test('should return 400 for missing email', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ password: 'admin123!' });
            expect(response.status).toBe(400);
        });

        test('should return 400 for missing password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'admin@example.com' });
            expect(response.status).toBe(400);
        });

        test('should return 400 for empty body', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({});
            expect(response.status).toBe(400);
        });

        test('should return 401 for wrong password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'admin@example.com', password: 'wrongpassword' });
            expect(response.status).toBe(401);
        });

        test('should return 401 for non-existent email', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'somepassword' });
            expect(response.status).toBe(401);
        });

        test('should not reveal whether email exists in error messages', async () => {
            const wrongEmailResponse = await request(app)
                .post('/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'somepassword' });

            const wrongPasswordResponse = await request(app)
                .post('/auth/login')
                .send({ email: 'admin@example.com', password: 'wrongpassword' });

            // Both should return same generic message to prevent user enumeration
            expect(wrongEmailResponse.body.message).toBe(wrongPasswordResponse.body.message);
        });

        test('should not return password in login response', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'admin@example.com', password: 'admin123!' });

            expect(response.status).toBe(200);
            expect(response.body.user).not.toHaveProperty('password');
            expect(JSON.stringify(response.body)).not.toContain('admin123!');
        });
    });
});
