/**
 * Smoke Performance Scenario
 * - 1 to 5 users
 * - Short execution
 * - Validates availability and basic functionality
 */
export const smokeScenario = {
    smoke: {
        executor: 'constant-vus',
        vus: 3,
        duration: '1m',
        gracefulStop: '10s',
    },
};
