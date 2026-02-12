/**
 * Stress Test Scenario
 * - Exceeds nominal load
 * - Identifies degradation point
 * - Progressive ramp-up beyond expected capacity
 */
export const stressScenario = {
    stress: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
            { duration: '1m', target: 20 },   // ramp-up to normal load
            { duration: '2m', target: 50 },   // ramp-up beyond normal
            { duration: '2m', target: 100 },  // push to stress level
            { duration: '2m', target: 100 },  // sustain stress level
            { duration: '1m', target: 0 },    // ramp-down
        ],
        gracefulStop: '30s',
    },
};
