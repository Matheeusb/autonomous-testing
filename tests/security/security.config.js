module.exports = {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

    admin: {
        email: 'admin@example.com',
        password: 'admin123!',
    },

    testUser: {
        name: 'Security Test User',
        email: 'securitytest@example.com',
        age: 25,
        password: 'securePass1!',
        role: 'USER',
    },

    testUser2: {
        name: 'Security Test User 2',
        email: 'securitytest2@example.com',
        age: 30,
        password: 'securePass2!',
        role: 'USER',
    },

    injectionPayloads: {
        sql: [
            "' OR 1=1 --",
            "'; DROP TABLE users; --",
            "\" OR \"\"=\"",
            "1; SELECT * FROM users",
            "admin'--",
            "' UNION SELECT * FROM users --",
            "1 OR 1=1",
        ],
        nosql: [
            '{"$ne": null}',
            '{"$gt": ""}',
            '{"$regex": ".*"}',
            '{"$where": "1==1"}',
        ],
        command: [
            '; ls -la',
            '| cat /etc/passwd',
            '$(whoami)',
            '`id`',
        ],
        xss: [
            '<script>alert(1)</script>',
            '<img src=x onerror=alert(1)>',
            'javascript:alert(1)',
            '<svg/onload=alert(1)>',
            '"><script>alert(document.cookie)</script>',
        ],
    },

    sensitiveFields: ['password', 'token', 'secret', 'hash'],

    rateLimiting: {
        maxRequests: 100,
        timeWindowMs: 60000,
    },
};
