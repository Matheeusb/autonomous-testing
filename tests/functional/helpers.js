const request = require('supertest');
const app = require('../../src/app');
const { getDatabase } = require('../../src/config/database');

const ADMIN_CREDENTIALS = {
    email: 'admin@example.com',
    password: 'admin123!',
};

async function getAdminToken() {
    const response = await request(app)
        .post('/auth/login')
        .send(ADMIN_CREDENTIALS);

    return response.body.token;
}

async function createUserAndGetToken(adminToken, userData) {
    const createResponse = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

    const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: userData.email, password: userData.password });

    return {
        user: createResponse.body,
        token: loginResponse.body.token,
    };
}

function cleanDatabase() {
    const db = getDatabase();
    db.prepare("DELETE FROM users WHERE email != ?").run(ADMIN_CREDENTIALS.email);
}

function closeDatabase() {
    const db = getDatabase();
    db.close();
}

module.exports = {
    ADMIN_CREDENTIALS,
    getAdminToken,
    createUserAndGetToken,
    cleanDatabase,
    closeDatabase,
};
