const { PactV4, MatchersV3 } = require('@pact-foundation/pact');
const path = require('path');

const { like, regex } = MatchersV3;

const provider = new PactV4({
    consumer: 'UserAPIConsumer',
    provider: 'AuthAPI',
    dir: path.resolve(process.cwd(), 'tests/contract/pacts'),
});

describe('Contrato - POST /auth/login', () => {
    describe('should return 200 when credentials are valid', () => {
        it('returns token and user data', async () => {
            await provider
                .addInteraction()
                .given('a user with valid credentials exists')
                .uponReceiving('a request to login with valid credentials')
                .withRequest('POST', '/auth/login', (builder) => {
                    builder
                        .headers({ 'Content-Type': 'application/json' })
                        .jsonBody({
                            email: 'admin@example.com',
                            password: 'admin123!',
                        });
                })
                .willRespondWith(200, (builder) => {
                    builder
                        .headers({ 'Content-Type': regex('application/json.*', 'application/json; charset=utf-8') })
                        .jsonBody({
                            token: like('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'),
                            user: {
                                id: like('550e8400-e29b-41d4-a716-446655440000'),
                                name: like('Admin'),
                                email: regex('^[\\w.-]+@[\\w.-]+\\.\\w+$', 'admin@example.com'),
                                role: regex('^(USER|ADMIN)$', 'ADMIN'),
                            },
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: 'admin@example.com',
                            password: 'admin123!',
                        }),
                    });

                    expect(response.status).toBe(200);

                    const body = await response.json();
                    expect(body).toHaveProperty('token');
                    expect(body).toHaveProperty('user');
                    expect(body.user).toHaveProperty('id');
                    expect(body.user).toHaveProperty('name');
                    expect(body.user).toHaveProperty('email');
                    expect(body.user).toHaveProperty('role');
                });
        });
    });

    describe('should return 400 when required fields are missing', () => {
        it('returns error message for missing email and password', async () => {
            await provider
                .addInteraction()
                .given('the auth endpoint is available')
                .uponReceiving('a request to login without email and password')
                .withRequest('POST', '/auth/login', (builder) => {
                    builder
                        .headers({ 'Content-Type': 'application/json' })
                        .jsonBody({});
                })
                .willRespondWith(400, (builder) => {
                    builder
                        .headers({ 'Content-Type': regex('application/json.*', 'application/json; charset=utf-8') })
                        .jsonBody({
                            message: like('Email and password are required'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                    });

                    expect(response.status).toBe(400);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 401 when credentials are invalid', () => {
        it('returns error message for invalid credentials', async () => {
            await provider
                .addInteraction()
                .given('no user with the given credentials exists')
                .uponReceiving('a request to login with invalid credentials')
                .withRequest('POST', '/auth/login', (builder) => {
                    builder
                        .headers({ 'Content-Type': 'application/json' })
                        .jsonBody({
                            email: 'wrong@example.com',
                            password: 'wrongpassword',
                        });
                })
                .willRespondWith(401, (builder) => {
                    builder
                        .headers({ 'Content-Type': regex('application/json.*', 'application/json; charset=utf-8') })
                        .jsonBody({
                            message: like('Invalid email or password'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: 'wrong@example.com',
                            password: 'wrongpassword',
                        }),
                    });

                    expect(response.status).toBe(401);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });
});
