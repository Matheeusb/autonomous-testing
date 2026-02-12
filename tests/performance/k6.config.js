/**
 * Shared k6 configuration for all load tests.
 * Import thresholds and default options from here to ensure consistency.
 */

export const defaultThresholds = {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
};

export const strictThresholds = {
    http_req_duration: ['p(95)<300', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
};

export const defaultHeaders = {
    'Content-Type': 'application/json',
};
