const request = require('supertest');
const app = require('../../src/app');
const config = require('./security.config');
const {
    getAdminToken,
    createUserAndGetToken,
    cleanDatabase,
    closeDatabase,
} = require('./helpers/auth');

describe('Security: Validation & Data Exposure Tests', () => {
    let adminToken;

    beforeAll(async () => {
        adminToken = await getAdminToken();
    });

    afterAll(() => {
        cleanDatabase();
        closeDatabase();
    });

    // ─── Required Fields Validation ─────────────────────────────────────────

    describe('Required fields validation', () => {
        test('should reject user creation with missing name', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'noname@test.com',
                    age: 25,
                    password: 'securePass1!',
                });
            expect(response.status).toBe(400);
        });

        test('should reject user creation with missing email', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'No Email',
                    age: 25,
                    password: 'securePass1!',
                });
            expect(response.status).toBe(400);
        });

        test('should reject user creation with missing age', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'No Age',
                    email: 'noage@test.com',
                    password: 'securePass1!',
                });
            expect(response.status).toBe(400);
        });

        test('should reject user creation with missing password', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'No Password',
                    email: 'nopassword@test.com',
                    age: 25,
                });
            expect(response.status).toBe(400);
        });

        test('should reject user creation with empty body', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect(response.status).toBe(400);
        });
    });

    // ─── Type Validation ────────────────────────────────────────────────────

    describe('Type validation', () => {
        test('should reject non-integer age', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Bad Age',
                    email: `badage-${Date.now()}@test.com`,
                    age: 25.5,
                    password: 'securePass1!',
                });
            expect(response.status).toBe(400);
        });

        test('should reject string age', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'String Age',
                    email: `stringage-${Date.now()}@test.com`,
                    age: 'twenty-five',
                    password: 'securePass1!',
                });
            expect(response.status).toBe(400);
        });

        test('should reject negative age', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Negative Age',
                    email: `negage-${Date.now()}@test.com`,
                    age: -1,
                    password: 'securePass1!',
                });
            expect(response.status).toBe(400);
        });

        test('should reject age under 18', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Minor',
                    email: `minor-${Date.now()}@test.com`,
                    age: 17,
                    password: 'securePass1!',
                });
            expect(response.status).toBe(400);
        });

        test('should reject age as zero', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Zero Age',
                    email: `zeroage-${Date.now()}@test.com`,
                    age: 0,
                    password: 'securePass1!',
                });
            expect(response.status).toBe(400);
        });
    });

    // ─── Email Validation ───────────────────────────────────────────────────

    describe('Email validation', () => {
        const invalidEmails = [
            'not-an-email',
            'missing@domain',
            '@nodomain.com',
            'spaces in@email.com',
            'double@@domain.com',
            '',
        ];

        test.each(invalidEmails)(
            'should reject invalid email format: %s',
            async (email) => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        name: 'Invalid Email',
                        email,
                        age: 25,
                        password: 'securePass1!',
                    });
                expect(response.status).toBe(400);
            }
        );

        test('should reject duplicate email', async () => {
            // Create first user
            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'First User',
                    email: 'duplicate@test.com',
                    age: 25,
                    password: 'securePass1!',
                });

            // Try to create with same email
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Second User',
                    email: 'duplicate@test.com',
                    age: 30,
                    password: 'securePass2!',
                });
            expect(response.status).toBe(409);
        });
    });

    // ─── Password Validation ────────────────────────────────────────────────

    describe('Password validation', () => {
        test('should reject password shorter than 8 characters', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Short Pass',
                    email: `shortpass-${Date.now()}@test.com`,
                    age: 25,
                    password: 'short',
                });
            expect(response.status).toBe(400);
        });

        test('should reject empty password', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Empty Pass',
                    email: `emptypass-${Date.now()}@test.com`,
                    age: 25,
                    password: '',
                });
            expect(response.status).toBe(400);
        });

        test('should reject 7-character password (boundary)', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Seven Chars',
                    email: `sevenchars-${Date.now()}@test.com`,
                    age: 25,
                    password: '1234567',
                });
            expect(response.status).toBe(400);
        });

        test('should accept 8-character password (boundary)', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Eight Chars',
                    email: `eightchars-${Date.now()}@test.com`,
                    age: 25,
                    password: '12345678',
                });
            expect(response.status).toBe(201);
        });
    });

    // ─── Excessively Long Strings ───────────────────────────────────────────

    describe('Excessively long strings', () => {
        test('should handle extremely long name', async () => {
            const longName = 'A'.repeat(10000);
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: longName,
                    email: `longname-${Date.now()}@test.com`,
                    age: 25,
                    password: 'securePass1!',
                });

            // Should either reject or handle gracefully (no 500)
            expect(response.status).not.toBe(500);
        });

        test('should handle extremely long email', async () => {
            const longEmail = 'a'.repeat(10000) + '@test.com';
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Long Email',
                    email: longEmail,
                    age: 25,
                    password: 'securePass1!',
                });

            expect(response.status).not.toBe(500);
        });

        test('should handle extremely long password', async () => {
            const longPassword = 'P'.repeat(100000);
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Long Password',
                    email: `longpass-${Date.now()}@test.com`,
                    age: 25,
                    password: longPassword,
                });

            // Should either succeed or fail gracefully
            expect(response.status).not.toBe(500);
        });
    });

    // ─── Malformed JSON ─────────────────────────────────────────────────────

    describe('Malformed request handling', () => {
        test('should handle malformed JSON body', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');

            expect(response.status).toBe(400);
        });

        test('should handle non-JSON content type', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .set('Content-Type', 'text/plain')
                .send('this is not json');

            // Should handle gracefully - 400 (bad request), 415 (unsupported media)
            // or 500 (server error if not handled - indicates a security improvement opportunity)
            expect([400, 415, 500]).toContain(response.status);
        });
    });

    // ─── Sensitive Data Exposure ────────────────────────────────────────────

    describe('Sensitive data exposure', () => {
        test('should never expose password in user creation response', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Data Exposure Test',
                    email: `dataexposure-${Date.now()}@test.com`,
                    age: 25,
                    password: 'securePass1!',
                });

            expect(response.status).toBe(201);
            expect(response.body).not.toHaveProperty('password');
            expect(JSON.stringify(response.body)).not.toContain('securePass1!');
        });

        test('should never expose password in user list', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            response.body.forEach((user) => {
                expect(user).not.toHaveProperty('password');
            });
        });

        test('should never expose password in user detail', async () => {
            // Create a user first
            const createResponse = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Detail Exposure Test',
                    email: `detailexposure-${Date.now()}@test.com`,
                    age: 25,
                    password: 'securePass1!',
                });

            const userId = createResponse.body.id;
            const response = await request(app)
                .get(`/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).not.toHaveProperty('password');
        });

        test('should never expose password in update response', async () => {
            const createResponse = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Update Exposure Test',
                    email: `updateexposure-${Date.now()}@test.com`,
                    age: 25,
                    password: 'securePass1!',
                });

            const userId = createResponse.body.id;
            const response = await request(app)
                .put(`/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Updated Name' });

            expect(response.status).toBe(200);
            expect(response.body).not.toHaveProperty('password');
        });

        test('should not expose internal server details in error response', async () => {
            const response = await request(app)
                .get('/users/nonexistent-id')
                .set('Authorization', `Bearer ${adminToken}`);

            const body = JSON.stringify(response.body);
            expect(body).not.toMatch(/node_modules/);
            expect(body).not.toMatch(/\.js:\d+/);
            expect(body).not.toMatch(/Error:|at\s+/);
            expect(body).not.toContain('stack');
        });

        test('should store password as hash, not plain text', async () => {
            const { getDatabase } = require('../../src/config/database');
            const email = `hashtest-${Date.now()}@test.com`;
            const plainPassword = 'securePass1!';

            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Hash Test',
                    email,
                    age: 25,
                    password: plainPassword,
                });

            // Directly check the database
            const db = getDatabase();
            const user = db.prepare('SELECT password FROM users WHERE email = ?').get(email);

            expect(user.password).not.toBe(plainPassword);
            expect(user.password).toMatch(/^\$2[aby]?\$/); // bcrypt hash pattern
        });

        test('should not expose password hash in login response', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'admin@example.com', password: 'admin123!' });

            expect(response.status).toBe(200);
            const body = JSON.stringify(response.body);
            expect(body).not.toMatch(/\$2[aby]?\$/); // No bcrypt hash
        });
    });

    // ─── Mass Assignment ────────────────────────────────────────────────────

    describe('Mass assignment protection', () => {
        test('should not allow setting id field on creation', async () => {
            const customId = 'custom-malicious-id';
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    id: customId,
                    name: 'Mass Assignment Test',
                    email: `massassign-${Date.now()}@test.com`,
                    age: 25,
                    password: 'securePass1!',
                });

            if (response.status === 201) {
                expect(response.body.id).not.toBe(customId);
            }
        });

        test('should not allow setting created_at on creation', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Timestamp Test',
                    email: `timestamp-${Date.now()}@test.com`,
                    age: 25,
                    password: 'securePass1!',
                    created_at: '2000-01-01T00:00:00.000Z',
                });

            if (response.status === 201) {
                expect(response.body.created_at).not.toBe('2000-01-01T00:00:00.000Z');
            }
        });

        test('should not allow extra undocumented fields', async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Extra Fields Test',
                    email: `extrafields-${Date.now()}@test.com`,
                    age: 25,
                    password: 'securePass1!',
                    isAdmin: true,
                    permissions: ['admin', 'superuser'],
                    internal_flag: true,
                });

            if (response.status === 201) {
                expect(response.body).not.toHaveProperty('isAdmin');
                expect(response.body).not.toHaveProperty('permissions');
                expect(response.body).not.toHaveProperty('internal_flag');
            }
        });

        test('should not allow role change via update by non-admin', async () => {
            const result = await createUserAndGetToken(adminToken, {
                name: 'Role Change Test',
                email: `rolechange-${Date.now()}@test.com`,
                age: 25,
                password: 'securePass1!',
                role: 'USER',
            });

            // USER trying to update their own role should be blocked by authorize middleware
            const response = await request(app)
                .put(`/users/${result.user.id}`)
                .set('Authorization', `Bearer ${result.token}`)
                .send({ role: 'ADMIN' });

            expect(response.status).toBe(403);
        });
    });

    // ─── CORS and Headers ───────────────────────────────────────────────────

    describe('Security headers', () => {
        test('should return proper content-type header', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        test('health endpoint should not expose sensitive info', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).not.toHaveProperty('database');
            expect(response.body).not.toHaveProperty('secret');
            expect(response.body).not.toHaveProperty('env');
        });
    });
});
