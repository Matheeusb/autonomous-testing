const { PactV4, MatchersV3 } = require('@pact-foundation/pact');
const path = require('path');

const { like, eachLike, regex } = MatchersV3;

const UUID_REGEX = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
const ISO_DATE_REGEX = '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$';
const EMAIL_REGEX = '^[\\w.-]+@[\\w.-]+\\.\\w+$';
const ROLE_REGEX = '^(USER|ADMIN)$';

const VALID_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid-token';

const userShape = {
    id: regex(UUID_REGEX, '550e8400-e29b-41d4-a716-446655440000'),
    name: like('John Doe'),
    email: regex(EMAIL_REGEX, 'john@example.com'),
    age: like(25),
    role: regex(ROLE_REGEX, 'USER'),
    created_at: regex(ISO_DATE_REGEX, '2026-02-10T12:00:00.000Z'),
    updated_at: regex(ISO_DATE_REGEX, '2026-02-10T12:00:00.000Z'),
};

const JSON_CONTENT_TYPE = regex('application/json.*', 'application/json; charset=utf-8');

const provider = new PactV4({
    consumer: 'UserAPIConsumer',
    provider: 'UsersAPI',
    dir: path.resolve(process.cwd(), 'tests/contract/pacts'),
});

// ============================================================
// POST /users - Criar Usuário
// ============================================================
describe('Contrato - POST /users', () => {
    describe('should return 201 when user is created successfully', () => {
        it('returns the created user', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user and no conflicting email')
                .uponReceiving('a request to create a new user')
                .withRequest('POST', '/users', (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({
                            name: 'John Doe',
                            email: 'john@example.com',
                            age: 25,
                            password: 'password123',
                            role: 'USER',
                        });
                })
                .willRespondWith(201, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody(userShape);
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({
                            name: 'John Doe',
                            email: 'john@example.com',
                            age: 25,
                            password: 'password123',
                            role: 'USER',
                        }),
                    });

                    expect(response.status).toBe(201);

                    const body = await response.json();
                    expect(body).toHaveProperty('id');
                    expect(body).toHaveProperty('name');
                    expect(body).toHaveProperty('email');
                    expect(body).toHaveProperty('age');
                    expect(body).toHaveProperty('role');
                    expect(body).toHaveProperty('created_at');
                    expect(body).toHaveProperty('updated_at');
                    expect(body).not.toHaveProperty('password');
                });
        });
    });

    describe('should return 400 when required fields are missing', () => {
        it('returns validation error message', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user')
                .uponReceiving('a request to create a user without required fields')
                .withRequest('POST', '/users', (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({
                            name: 'John Doe',
                        });
                })
                .willRespondWith(400, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Name, email, age and password are required'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({
                            name: 'John Doe',
                        }),
                    });

                    expect(response.status).toBe(400);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 400 when password is too short', () => {
        it('returns password validation error', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user')
                .uponReceiving('a request to create a user with short password')
                .withRequest('POST', '/users', (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({
                            name: 'John Doe',
                            email: 'john@example.com',
                            age: 25,
                            password: 'short',
                        });
                })
                .willRespondWith(400, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Password must be at least 8 characters long'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({
                            name: 'John Doe',
                            email: 'john@example.com',
                            age: 25,
                            password: 'short',
                        }),
                    });

                    expect(response.status).toBe(400);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 400 when user age is under 18', () => {
        it('returns age validation error', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user')
                .uponReceiving('a request to create a user under 18 years old')
                .withRequest('POST', '/users', (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({
                            name: 'Young User',
                            email: 'young@example.com',
                            age: 16,
                            password: 'password123',
                        });
                })
                .willRespondWith(400, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('User must be at least 18 years old'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({
                            name: 'Young User',
                            email: 'young@example.com',
                            age: 16,
                            password: 'password123',
                        }),
                    });

                    expect(response.status).toBe(400);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 401 when Authorization header is missing', () => {
        it('returns authentication error', async () => {
            await provider
                .addInteraction()
                .given('no authentication provided')
                .uponReceiving('a request to create a user without authorization')
                .withRequest('POST', '/users', (builder) => {
                    builder
                        .headers({ 'Content-Type': 'application/json' })
                        .jsonBody({
                            name: 'John Doe',
                            email: 'john@example.com',
                            age: 25,
                            password: 'password123',
                        });
                })
                .willRespondWith(401, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Authorization header is required'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: 'John Doe',
                            email: 'john@example.com',
                            age: 25,
                            password: 'password123',
                        }),
                    });

                    expect(response.status).toBe(401);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 403 when user has insufficient permissions', () => {
        it('returns forbidden error', async () => {
            await provider
                .addInteraction()
                .given('an authenticated user with USER role')
                .uponReceiving('a request to create a user with insufficient permissions')
                .withRequest('POST', '/users', (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({
                            name: 'John Doe',
                            email: 'john@example.com',
                            age: 25,
                            password: 'password123',
                        });
                })
                .willRespondWith(403, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Insufficient permissions'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({
                            name: 'John Doe',
                            email: 'john@example.com',
                            age: 25,
                            password: 'password123',
                        }),
                    });

                    expect(response.status).toBe(403);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });
});

// ============================================================
// GET /users - Listar Usuários
// ============================================================
describe('Contrato - GET /users', () => {
    describe('should return 200 when listing users', () => {
        it('returns an array of users', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user and users exist')
                .uponReceiving('a request to list all users')
                .withRequest('GET', '/users', (builder) => {
                    builder.headers({ Authorization: VALID_TOKEN });
                })
                .willRespondWith(200, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody(eachLike(userShape));
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users`, {
                        method: 'GET',
                        headers: { Authorization: VALID_TOKEN },
                    });

                    expect(response.status).toBe(200);

                    const body = await response.json();
                    expect(Array.isArray(body)).toBe(true);
                    expect(body.length).toBeGreaterThanOrEqual(1);

                    const user = body[0];
                    expect(user).toHaveProperty('id');
                    expect(user).toHaveProperty('name');
                    expect(user).toHaveProperty('email');
                    expect(user).toHaveProperty('age');
                    expect(user).toHaveProperty('role');
                    expect(user).toHaveProperty('created_at');
                    expect(user).toHaveProperty('updated_at');
                    expect(user).not.toHaveProperty('password');
                });
        });
    });

    describe('should return 401 when Authorization header is missing', () => {
        it('returns authentication error', async () => {
            await provider
                .addInteraction()
                .given('no authentication provided')
                .uponReceiving('a request to list users without authorization')
                .withRequest('GET', '/users')
                .willRespondWith(401, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Authorization header is required'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users`, {
                        method: 'GET',
                    });

                    expect(response.status).toBe(401);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });
});

// ============================================================
// GET /users/:id - Buscar Usuário por ID
// ============================================================
describe('Contrato - GET /users/:id', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    describe('should return 200 when user is found', () => {
        it('returns the user data', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user and user exists')
                .uponReceiving('a request to get a user by ID')
                .withRequest('GET', `/users/${userId}`, (builder) => {
                    builder.headers({ Authorization: VALID_TOKEN });
                })
                .willRespondWith(200, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody(userShape);
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'GET',
                        headers: { Authorization: VALID_TOKEN },
                    });

                    expect(response.status).toBe(200);

                    const body = await response.json();
                    expect(body).toHaveProperty('id');
                    expect(body).toHaveProperty('name');
                    expect(body).toHaveProperty('email');
                    expect(body).toHaveProperty('age');
                    expect(body).toHaveProperty('role');
                    expect(body).toHaveProperty('created_at');
                    expect(body).toHaveProperty('updated_at');
                    expect(body).not.toHaveProperty('password');
                });
        });
    });

    describe('should return 401 when Authorization header is missing', () => {
        it('returns authentication error', async () => {
            await provider
                .addInteraction()
                .given('no authentication provided')
                .uponReceiving('a request to get a user by ID without authorization')
                .withRequest('GET', `/users/${userId}`)
                .willRespondWith(401, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Authorization header is required'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'GET',
                    });

                    expect(response.status).toBe(401);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 403 when user has insufficient permissions', () => {
        it('returns forbidden error', async () => {
            await provider
                .addInteraction()
                .given('an authenticated user with USER role accessing another user')
                .uponReceiving('a request to get another user by ID with USER role')
                .withRequest('GET', `/users/${userId}`, (builder) => {
                    builder.headers({ Authorization: VALID_TOKEN });
                })
                .willRespondWith(403, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Insufficient permissions'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'GET',
                        headers: { Authorization: VALID_TOKEN },
                    });

                    expect(response.status).toBe(403);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 404 when user is not found', () => {
        it('returns not found error', async () => {
            const nonExistentId = '99999999-9999-9999-9999-999999999999';

            await provider
                .addInteraction()
                .given('an authenticated admin user and user does not exist')
                .uponReceiving('a request to get a non-existent user by ID')
                .withRequest('GET', `/users/${nonExistentId}`, (builder) => {
                    builder.headers({ Authorization: VALID_TOKEN });
                })
                .willRespondWith(404, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('User not found'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${nonExistentId}`, {
                        method: 'GET',
                        headers: { Authorization: VALID_TOKEN },
                    });

                    expect(response.status).toBe(404);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });
});

// ============================================================
// PUT /users/:id - Atualizar Usuário
// ============================================================
describe('Contrato - PUT /users/:id', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    describe('should return 200 when user is updated successfully', () => {
        it('returns the updated user', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user and user exists')
                .uponReceiving('a request to update an existing user')
                .withRequest('PUT', `/users/${userId}`, (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({
                            name: 'John Updated',
                            email: 'john.updated@example.com',
                            age: 26,
                        });
                })
                .willRespondWith(200, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody(userShape);
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({
                            name: 'John Updated',
                            email: 'john.updated@example.com',
                            age: 26,
                        }),
                    });

                    expect(response.status).toBe(200);

                    const body = await response.json();
                    expect(body).toHaveProperty('id');
                    expect(body).toHaveProperty('name');
                    expect(body).toHaveProperty('email');
                    expect(body).toHaveProperty('age');
                    expect(body).toHaveProperty('role');
                    expect(body).toHaveProperty('created_at');
                    expect(body).toHaveProperty('updated_at');
                    expect(body).not.toHaveProperty('password');
                });
        });
    });

    describe('should return 400 when password is too short', () => {
        it('returns password validation error', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user and user exists')
                .uponReceiving('a request to update a user with short password')
                .withRequest('PUT', `/users/${userId}`, (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({
                            password: 'short',
                        });
                })
                .willRespondWith(400, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Password must be at least 8 characters long'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({
                            password: 'short',
                        }),
                    });

                    expect(response.status).toBe(400);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 400 when age is under 18', () => {
        it('returns age validation error', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user and user exists')
                .uponReceiving('a request to update a user with age under 18')
                .withRequest('PUT', `/users/${userId}`, (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({
                            age: 15,
                        });
                })
                .willRespondWith(400, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('User must be at least 18 years old'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({
                            age: 15,
                        }),
                    });

                    expect(response.status).toBe(400);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 401 when Authorization header is missing', () => {
        it('returns authentication error', async () => {
            await provider
                .addInteraction()
                .given('no authentication provided')
                .uponReceiving('a request to update a user without authorization')
                .withRequest('PUT', `/users/${userId}`, (builder) => {
                    builder
                        .headers({ 'Content-Type': 'application/json' })
                        .jsonBody({ name: 'Updated' });
                })
                .willRespondWith(401, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Authorization header is required'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: 'Updated' }),
                    });

                    expect(response.status).toBe(401);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 403 when user has insufficient permissions', () => {
        it('returns forbidden error', async () => {
            await provider
                .addInteraction()
                .given('an authenticated user with USER role')
                .uponReceiving('a request to update a user with insufficient permissions')
                .withRequest('PUT', `/users/${userId}`, (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({ name: 'Updated' });
                })
                .willRespondWith(403, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Insufficient permissions'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({ name: 'Updated' }),
                    });

                    expect(response.status).toBe(403);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 404 when user is not found', () => {
        it('returns not found error', async () => {
            const nonExistentId = '99999999-9999-9999-9999-999999999999';

            await provider
                .addInteraction()
                .given('an authenticated admin user and user does not exist')
                .uponReceiving('a request to update a non-existent user')
                .withRequest('PUT', `/users/${nonExistentId}`, (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({ name: 'Updated' });
                })
                .willRespondWith(404, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('User not found'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${nonExistentId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({ name: 'Updated' }),
                    });

                    expect(response.status).toBe(404);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 409 when email is already in use', () => {
        it('returns conflict error', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user and email already exists')
                .uponReceiving('a request to update a user with duplicate email')
                .withRequest('PUT', `/users/${userId}`, (builder) => {
                    builder
                        .headers({
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        })
                        .jsonBody({
                            email: 'existing@example.com',
                        });
                })
                .willRespondWith(409, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Email already in use'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: VALID_TOKEN,
                        },
                        body: JSON.stringify({
                            email: 'existing@example.com',
                        }),
                    });

                    expect(response.status).toBe(409);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });
});

// ============================================================
// DELETE /users/:id - Deletar Usuário
// ============================================================
describe('Contrato - DELETE /users/:id', () => {
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    describe('should return 204 when user is deleted successfully', () => {
        it('returns no content', async () => {
            await provider
                .addInteraction()
                .given('an authenticated admin user and user exists')
                .uponReceiving('a request to delete an existing user')
                .withRequest('DELETE', `/users/${userId}`, (builder) => {
                    builder.headers({ Authorization: VALID_TOKEN });
                })
                .willRespondWith(204)
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'DELETE',
                        headers: { Authorization: VALID_TOKEN },
                    });

                    expect(response.status).toBe(204);
                });
        });
    });

    describe('should return 401 when Authorization header is missing', () => {
        it('returns authentication error', async () => {
            await provider
                .addInteraction()
                .given('no authentication provided')
                .uponReceiving('a request to delete a user without authorization')
                .withRequest('DELETE', `/users/${userId}`)
                .willRespondWith(401, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Authorization header is required'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'DELETE',
                    });

                    expect(response.status).toBe(401);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 403 when user has insufficient permissions', () => {
        it('returns forbidden error', async () => {
            await provider
                .addInteraction()
                .given('an authenticated user with USER role')
                .uponReceiving('a request to delete a user with insufficient permissions')
                .withRequest('DELETE', `/users/${userId}`, (builder) => {
                    builder.headers({ Authorization: VALID_TOKEN });
                })
                .willRespondWith(403, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('Insufficient permissions'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${userId}`, {
                        method: 'DELETE',
                        headers: { Authorization: VALID_TOKEN },
                    });

                    expect(response.status).toBe(403);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });

    describe('should return 404 when user is not found', () => {
        it('returns not found error', async () => {
            const nonExistentId = '99999999-9999-9999-9999-999999999999';

            await provider
                .addInteraction()
                .given('an authenticated admin user and user does not exist')
                .uponReceiving('a request to delete a non-existent user')
                .withRequest('DELETE', `/users/${nonExistentId}`, (builder) => {
                    builder.headers({ Authorization: VALID_TOKEN });
                })
                .willRespondWith(404, (builder) => {
                    builder
                        .headers({ 'Content-Type': JSON_CONTENT_TYPE })
                        .jsonBody({
                            message: like('User not found'),
                        });
                })
                .executeTest(async (mockServer) => {
                    const response = await fetch(`${mockServer.url}/users/${nonExistentId}`, {
                        method: 'DELETE',
                        headers: { Authorization: VALID_TOKEN },
                    });

                    expect(response.status).toBe(404);

                    const body = await response.json();
                    expect(body).toHaveProperty('message');
                });
        });
    });
});
