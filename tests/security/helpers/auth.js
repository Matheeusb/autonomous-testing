const request = require('supertest');
const app = require('../../../src/app');
const { getDatabase } = require('../../../src/config/database');
const config = require('../security.config');

/**
 * Authenticates as admin and returns a valid JWT token.
 * @returns {Promise<string>} Admin JWT token
 */
async function getAdminToken() {
    const response = await request(app)
        .post('/auth/login')
        .send({ email: config.admin.email, password: config.admin.password });

    if (response.status !== 200) {
        throw new Error(`Admin login failed with status ${response.status}`);
    }

    return response.body.token;
}

/**
 * Creates a user via admin and returns the user data and their token.
 * @param {string} adminToken - Admin JWT token
 * @param {object} userData - User data to create
 * @returns {Promise<{user: object, token: string}>}
 */
async function createUserAndGetToken(adminToken, userData) {
    const createResponse = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

    if (createResponse.status !== 201) {
        throw new Error(`User creation failed with status ${createResponse.status}: ${JSON.stringify(createResponse.body)}`);
    }

    const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: userData.email, password: userData.password });

    return {
        user: createResponse.body,
        token: loginResponse.body.token,
    };
}

/**
 * Generates an expired JWT token for testing.
 * @returns {string} An expired JWT token
 */
function generateExpiredToken() {
    const jwt = require('jsonwebtoken');
    const jwtConfig = require('../../../src/config/jwt');
    return jwt.sign(
        { id: 'test-id', email: 'test@example.com', role: 'USER' },
        jwtConfig.secret,
        { expiresIn: '0s' }
    );
}

/**
 * Generates a token signed with a wrong secret.
 * @returns {string} A JWT token signed with invalid secret
 */
function generateInvalidSecretToken() {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
        { id: 'test-id', email: 'test@example.com', role: 'ADMIN' },
        'wrong-secret-key-that-is-not-valid',
        { expiresIn: '1h' }
    );
}

/**
 * Cleans up test data from the database, keeping only the admin user.
 */
function cleanDatabase() {
    const db = getDatabase();
    db.prepare("DELETE FROM users WHERE email != ?").run(config.admin.email);
}

/**
 * Closes the database connection.
 */
function closeDatabase() {
    const db = getDatabase();
    db.close();
}

module.exports = {
    getAdminToken,
    createUserAndGetToken,
    generateExpiredToken,
    generateInvalidSecretToken,
    cleanDatabase,
    closeDatabase,
};
