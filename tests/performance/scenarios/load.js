/**
 * Load Test Scenario
 * - Simulates expected production load
 * - Gradual ramp-up
 * - Minimum 3 minutes sustain
 */
export const loadScenario = {
    load: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
            { duration: '1m', target: 20 },   // ramp-up to 20 users
            { duration: '3m', target: 20 },   // sustain 20 users for 3 minutes
            { duration: '1m', target: 0 },    // ramp-down to 0
        ],
        gracefulStop: '30s',
    },
};
