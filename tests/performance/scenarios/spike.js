/**
 * Spike Test Scenario
 * - Abrupt user growth
 * - Measures elasticity and recovery
 * - Sudden spike followed by return to baseline
 */
export const spikeScenario = {
    spike: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
            { duration: '30s', target: 5 },    // baseline
            { duration: '10s', target: 100 },  // sudden spike
            { duration: '1m', target: 100 },   // sustain spike
            { duration: '10s', target: 5 },    // drop back to baseline
            { duration: '1m', target: 5 },     // recovery period
            { duration: '30s', target: 0 },    // ramp-down
        ],
        gracefulStop: '30s',
    },
};
