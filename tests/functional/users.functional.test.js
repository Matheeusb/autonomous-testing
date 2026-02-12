const request = require('supertest');
const app = require('../../src/app');
const {
    ADMIN_CREDENTIALS,
    getAdminToken,
    createUserAndGetToken,
    cleanDatabase,
} = require('./helpers');

describe('Users API', () => {
    let adminToken;

    beforeAll(async () => {
        adminToken = await getAdminToken();
    });

    beforeEach(() => {
        cleanDatabase();
    });

    afterAll(() => {
        const { getDatabase } = require('../../src/config/database');
        getDatabase().close();
    });

    // ─── POST /users ───────────────────────────────────────────

    describe('POST /users', () => {
        const validUser = {
            name: 'John Doe',
            email: 'john@example.com',
            age: 25,
            password: 'password123',
        };

        describe('successful creation', () => {
            it('should create a user and return 201', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(validUser);

                expect(response.status).toBe(201);
                expect(response.body).toEqual(
                    expect.objectContaining({
                        id: expect.any(String),
                        name: validUser.name,
                        email: validUser.email,
                        age: validUser.age,
                        role: 'USER',
                        created_at: expect.any(String),
                        updated_at: expect.any(String),
                    })
                );
            });

            it('should not return password in response', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(validUser);

                expect(response.status).toBe(201);
                expect(response.body).not.toHaveProperty('password');
            });

            it('should assign USER role by default', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(validUser);

                expect(response.status).toBe(201);
                expect(response.body.role).toBe('USER');
            });

            it('should create user with ADMIN role when specified', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ ...validUser, role: 'ADMIN' });

                expect(response.status).toBe(201);
                expect(response.body.role).toBe('ADMIN');
            });

            it('should generate a UUID for the user id', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(validUser);

                expect(response.status).toBe(201);
                expect(response.body.id).toMatch(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
                );
            });

            it('should allow the created user to login', async () => {
                await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(validUser);

                const loginResponse = await request(app)
                    .post('/auth/login')
                    .send({ email: validUser.email, password: validUser.password });

                expect(loginResponse.status).toBe(200);
                expect(loginResponse.body).toHaveProperty('token');
            });
        });

        describe('validation errors', () => {
            it('should return 400 when name is missing', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ email: 'test@example.com', age: 25, password: 'password123' });

                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: 'Name, email, age and password are required' });
            });

            it('should return 400 when email is missing', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Test', age: 25, password: 'password123' });

                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: 'Name, email, age and password are required' });
            });

            it('should return 400 when age is missing', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Test', email: 'test@example.com', password: 'password123' });

                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: 'Name, email, age and password are required' });
            });

            it('should return 400 when password is missing', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Test', email: 'test@example.com', age: 25 });

                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: 'Name, email, age and password are required' });
            });

            it('should return 400 for invalid email format', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ ...validUser, email: 'invalid-email' });

                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: 'Invalid email format' });
            });

            it('should return 400 when password is shorter than 8 characters', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ ...validUser, password: 'short' });

                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: 'Password must be at least 8 characters long' });
            });

            it('should return 400 when age is under 18', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ ...validUser, age: 17 });

                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: 'User must be at least 18 years old' });
            });

            it('should return 409 when email is already in use', async () => {
                await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(validUser);

                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send(validUser);

                expect(response.status).toBe(409);
                expect(response.body).toEqual({ message: 'Email already in use' });
            });

            it('should return 409 when using the admin email', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ ...validUser, email: ADMIN_CREDENTIALS.email });

                expect(response.status).toBe(409);
                expect(response.body).toEqual({ message: 'Email already in use' });
            });
        });

        describe('authentication and authorization', () => {
            it('should return 401 without authorization header', async () => {
                const response = await request(app)
                    .post('/users')
                    .send(validUser);

                expect(response.status).toBe(401);
                expect(response.body).toEqual({ message: 'Authorization header is required' });
            });

            it('should return 401 with invalid token', async () => {
                const response = await request(app)
                    .post('/users')
                    .set('Authorization', 'Bearer invalid-token')
                    .send(validUser);

                expect(response.status).toBe(401);
                expect(response.body).toEqual({ message: 'Invalid or expired token' });
            });

            it('should return 403 when USER role tries to create a user', async () => {
                const { token: userToken } = await createUserAndGetToken(adminToken, validUser);

                const response = await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        name: 'Another User',
                        email: 'another@example.com',
                        age: 20,
                        password: 'password123',
                    });

                expect(response.status).toBe(403);
                expect(response.body).toEqual({ message: 'Insufficient permissions' });
            });
        });
    });

    // ─── GET /users ────────────────────────────────────────────

    describe('GET /users', () => {
        it('should return all users for ADMIN role', async () => {
            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'User 1', email: 'user1@example.com', age: 20, password: 'password123' });

            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'User 2', email: 'user2@example.com', age: 22, password: 'password123' });

            const response = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3); // admin + 2 created users
        });

        it('should return only own data for USER role', async () => {
            const userData = { name: 'Regular User', email: 'regular@example.com', age: 25, password: 'password123' };
            const { user, token: userToken } = await createUserAndGetToken(adminToken, userData);

            const response = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].email).toBe(userData.email);
        });

        it('should not include password in any user object', async () => {
            await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'User', email: 'user@example.com', age: 20, password: 'password123' });

            const response = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            response.body.forEach((user) => {
                expect(user).not.toHaveProperty('password');
            });
        });

        it('should return 401 without authorization header', async () => {
            const response = await request(app).get('/users');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Authorization header is required' });
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app)
                .get('/users')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });
    });

    // ─── GET /users/:id ────────────────────────────────────────

    describe('GET /users/:id', () => {
        it('should return user by id for ADMIN role', async () => {
            const createResponse = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'John Doe', email: 'john@example.com', age: 25, password: 'password123' });

            const userId = createResponse.body.id;

            const response = await request(app)
                .get(`/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                expect.objectContaining({
                    id: userId,
                    name: 'John Doe',
                    email: 'john@example.com',
                    age: 25,
                    role: 'USER',
                })
            );
        });

        it('should allow USER to get own profile', async () => {
            const userData = { name: 'Self User', email: 'self@example.com', age: 30, password: 'password123' };
            const { user, token: userToken } = await createUserAndGetToken(adminToken, userData);

            const response = await request(app)
                .get(`/users/${user.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.email).toBe(userData.email);
        });

        it('should return 403 when USER tries to access another user', async () => {
            const user1Data = { name: 'User One', email: 'user1@example.com', age: 20, password: 'password123' };
            const user2Data = { name: 'User Two', email: 'user2@example.com', age: 22, password: 'password123' };

            const { token: user1Token } = await createUserAndGetToken(adminToken, user1Data);

            const user2Response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(user2Data);

            const response = await request(app)
                .get(`/users/${user2Response.body.id}`)
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.status).toBe(403);
            expect(response.body).toEqual({ message: 'Insufficient permissions' });
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/users/00000000-0000-4000-8000-000000000000')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'User not found' });
        });

        it('should not return password in response', async () => {
            const createResponse = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'No Pass', email: 'nopass@example.com', age: 20, password: 'password123' });

            const response = await request(app)
                .get(`/users/${createResponse.body.id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).not.toHaveProperty('password');
        });

        it('should return 401 without authorization header', async () => {
            const response = await request(app).get('/users/some-id');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Authorization header is required' });
        });
    });

    // ─── PUT /users/:id ────────────────────────────────────────

    describe('PUT /users/:id', () => {
        let createdUserId;

        beforeEach(async () => {
            const response = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Update Me', email: 'update@example.com', age: 25, password: 'password123' });

            createdUserId = response.body.id;
        });

        describe('successful updates', () => {
            it('should update user name', async () => {
                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Updated Name' });

                expect(response.status).toBe(200);
                expect(response.body.name).toBe('Updated Name');
                expect(response.body.email).toBe('update@example.com');
            });

            it('should update user email', async () => {
                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ email: 'newemail@example.com' });

                expect(response.status).toBe(200);
                expect(response.body.email).toBe('newemail@example.com');
            });

            it('should update user age', async () => {
                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ age: 30 });

                expect(response.status).toBe(200);
                expect(response.body.age).toBe(30);
            });

            it('should update user role', async () => {
                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ role: 'ADMIN' });

                expect(response.status).toBe(200);
                expect(response.body.role).toBe('ADMIN');
            });

            it('should update password and allow login with new password', async () => {
                await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ password: 'newpassword123' });

                const loginResponse = await request(app)
                    .post('/auth/login')
                    .send({ email: 'update@example.com', password: 'newpassword123' });

                expect(loginResponse.status).toBe(200);
                expect(loginResponse.body).toHaveProperty('token');
            });

            it('should update multiple fields at once', async () => {
                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'New Name', age: 35 });

                expect(response.status).toBe(200);
                expect(response.body.name).toBe('New Name');
                expect(response.body.age).toBe(35);
            });

            it('should not return password in response', async () => {
                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Updated' });

                expect(response.status).toBe(200);
                expect(response.body).not.toHaveProperty('password');
            });

            it('should update updated_at timestamp', async () => {
                const getBefore = await request(app)
                    .get(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                const originalUpdatedAt = getBefore.body.updated_at;

                // small delay to ensure timestamp difference
                await new Promise((resolve) => setTimeout(resolve, 1100));

                await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Timestamp Test' });

                const getAfter = await request(app)
                    .get(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(getAfter.body.updated_at).not.toBe(originalUpdatedAt);
            });
        });

        describe('validation errors', () => {
            it('should return 400 when password is shorter than 8 characters', async () => {
                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ password: 'short' });

                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: 'Password must be at least 8 characters long' });
            });

            it('should return 400 when age is under 18', async () => {
                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ age: 15 });

                expect(response.status).toBe(400);
                expect(response.body).toEqual({ message: 'User must be at least 18 years old' });
            });

            it('should return 409 when updating to an email already in use', async () => {
                await request(app)
                    .post('/users')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Other', email: 'taken@example.com', age: 20, password: 'password123' });

                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ email: 'taken@example.com' });

                expect(response.status).toBe(409);
                expect(response.body).toEqual({ message: 'Email already in use' });
            });

            it('should return 404 for non-existent user', async () => {
                const response = await request(app)
                    .put('/users/00000000-0000-4000-8000-000000000000')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ name: 'Ghost' });

                expect(response.status).toBe(404);
                expect(response.body).toEqual({ message: 'User not found' });
            });
        });

        describe('authentication and authorization', () => {
            it('should return 401 without authorization header', async () => {
                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .send({ name: 'Unauthorized' });

                expect(response.status).toBe(401);
                expect(response.body).toEqual({ message: 'Authorization header is required' });
            });

            it('should return 403 when USER role tries to update', async () => {
                const userData = { name: 'Normal', email: 'normal@example.com', age: 20, password: 'password123' };
                const { token: userToken } = await createUserAndGetToken(adminToken, userData);

                const response = await request(app)
                    .put(`/users/${createdUserId}`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ name: 'Hacked' });

                expect(response.status).toBe(403);
                expect(response.body).toEqual({ message: 'Insufficient permissions' });
            });
        });
    });

    // ─── DELETE /users/:id ─────────────────────────────────────

    describe('DELETE /users/:id', () => {
        it('should delete user and return 204', async () => {
            const createResponse = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Delete Me', email: 'delete@example.com', age: 25, password: 'password123' });

            const userId = createResponse.body.id;

            const deleteResponse = await request(app)
                .delete(`/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(deleteResponse.status).toBe(204);
            expect(deleteResponse.body).toEqual({});
        });

        it('should make the user no longer accessible after deletion', async () => {
            const createResponse = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Gone User', email: 'gone@example.com', age: 25, password: 'password123' });

            const userId = createResponse.body.id;

            await request(app)
                .delete(`/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            const getResponse = await request(app)
                .get(`/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(getResponse.status).toBe(404);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .delete('/users/00000000-0000-4000-8000-000000000000')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'User not found' });
        });

        it('should return 401 without authorization header', async () => {
            const response = await request(app).delete('/users/some-id');

            expect(response.status).toBe(401);
            expect(response.body).toEqual({ message: 'Authorization header is required' });
        });

        it('should return 403 when USER role tries to delete', async () => {
            const userData = { name: 'Regular', email: 'regular@example.com', age: 20, password: 'password123' };
            const { user, token: userToken } = await createUserAndGetToken(adminToken, userData);

            const targetResponse = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Target', email: 'target@example.com', age: 22, password: 'password123' });

            const response = await request(app)
                .delete(`/users/${targetResponse.body.id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
            expect(response.body).toEqual({ message: 'Insufficient permissions' });
        });

        it('should permanently remove user data from the system', async () => {
            const createResponse = await request(app)
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Permanent Delete', email: 'perm@example.com', age: 25, password: 'password123' });

            const userId = createResponse.body.id;

            await request(app)
                .delete(`/users/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            // Verify user is removed from list
            const listResponse = await request(app)
                .get('/users')
                .set('Authorization', `Bearer ${adminToken}`);

            const deletedUser = listResponse.body.find((u) => u.id === userId);
            expect(deletedUser).toBeUndefined();

            // Verify login no longer works
            const loginResponse = await request(app)
                .post('/auth/login')
                .send({ email: 'perm@example.com', password: 'password123' });

            expect(loginResponse.status).toBe(401);
        });
    });
});
