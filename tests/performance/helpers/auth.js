import http from 'k6/http';
import { check } from 'k6';

/**
 * Authenticates with the API and returns a valid Bearer token.
 * @param {string} baseUrl - The base URL of the API.
 * @param {string} email - The user email for authentication.
 * @param {string} password - The user password for authentication.
 * @returns {string} The JWT token.
 */
export function authenticate(baseUrl, email, password) {
    const loginPayload = JSON.stringify({
        email,
        password,
    });

    const loginHeaders = {
        'Content-Type': 'application/json',
    };

    const res = http.post(`${baseUrl}/auth/login`, loginPayload, {
        headers: loginHeaders,
        tags: { name: 'auth_login' },
    });

    const loginSuccess = check(res, {
        'login status is 200': (r) => r.status === 200,
        'login returns token': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.token !== undefined && body.token !== null;
            } catch {
                return false;
            }
        },
    });

    if (!loginSuccess) {
        throw new Error(`Authentication failed: status=${res.status}, body=${res.body}`);
    }

    const body = JSON.parse(res.body);
    return body.token;
}

/**
 * Returns authorization headers with the provided token.
 * @param {string} token - The JWT token.
 * @returns {object} Headers object with Authorization and Content-Type.
 */
export function getAuthHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Returns authorization headers without Content-Type (for GET/DELETE requests).
 * @param {string} token - The JWT token.
 * @returns {object} Headers object with Authorization only.
 */
export function getAuthHeadersOnly(token) {
    return {
        Authorization: `Bearer ${token}`,
    };
}
