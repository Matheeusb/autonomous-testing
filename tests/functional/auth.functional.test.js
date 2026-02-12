const request = require('supertest');
const app = require('../../src/app');
const { ADMIN_CREDENTIALS, cleanDatabase } = require('./helpers');

describe('POST /auth/login', () => {
    beforeEach(() => {
        cleanDatabase();
    });

    afterAll(() => {
        const { getDatabase } = require('../../src/config/database');
        getDatabase().close();
    });

    describe('successful authentication', () => {
        it('should return 200 with token and user info for valid credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send(ADMIN_CREDENTIALS);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(typeof response.body.token).toBe('string');
            expect(response.body.token.length).toBeGreaterThan(0);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    name: 'Admin',
                    email: ADMIN_CREDENTIALS.email,
                    role: 'ADMIN',
                })
            );
        });

        it('should not return password in user object', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send(ADMIN_CREDENTIALS);

            expect(response.status).toBe(200);
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should return a valid JWT token that can be used for authentication', async () => {
            const loginResponse = await request(app)
                .post('/auth/login')
                .send(ADMIN_CREDENTIALS);

            const token = loginResponse.body.token;

            const usersResponse = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${token}`);

            expect(usersResponse.status).toBe(200);
        });
    });

    describe('missing fields', () => {
        it('should return 400 when email is missing', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ password: 'admin123!' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Email and password are required' });
        });

        it('should return 400 when password is missing', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'admin@example.com' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Email and password are required' });
        });

        it('should return 400 when body is empty', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Email and password are required' });
        });
    });

    describe('invalid credentials', () => {
        it('should return 401 for non-existent email', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Invalid email or password' });
        });

        it('should return 401 for wrong password', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({ email: ADMIN_CREDENTIALS.email, password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Invalid email or password' });
        });
    });
});
