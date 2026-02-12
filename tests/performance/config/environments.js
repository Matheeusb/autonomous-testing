const environments = {
    dev: {
        baseUrl: 'http://localhost:3000',
        adminEmail: 'admin@example.com',
        adminPassword: 'admin123!',
    },
    staging: {
        baseUrl: 'http://staging-api.example.com',
        adminEmail: 'admin@example.com',
        adminPassword: 'admin123!',
    },
    test: {
        baseUrl: 'http://test-api.example.com',
        adminEmail: 'admin@example.com',
        adminPassword: 'admin123!',
    },
};

export function getEnvironment() {
    const env = __ENV.ENVIRONMENT || 'dev';
    const config = environments[env];

    if (!config) {
        throw new Error(`Unknown environment: ${env}. Available: ${Object.keys(environments).join(', ')}`);
    }

    // Allow overrides via environment variables
    return {
        baseUrl: __ENV.BASE_URL || config.baseUrl,
        adminEmail: __ENV.ADMIN_EMAIL || config.adminEmail,
        adminPassword: __ENV.ADMIN_PASSWORD || config.adminPassword,
    };
}
