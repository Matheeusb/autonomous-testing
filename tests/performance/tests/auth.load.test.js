import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getEnvironment } from '../config/environments.js';
import { smokeScenario } from '../scenarios/smoke.js';
import { loadScenario } from '../scenarios/load.js';
import { stressScenario } from '../scenarios/stress.js';
import { spikeScenario } from '../scenarios/spike.js';
import { defaultThresholds } from '../k6.config.js';

const env = getEnvironment();

const scenarios = {
    smoke: smokeScenario,
    load: loadScenario,
    stress: stressScenario,
    spike: spikeScenario,
};

const selectedScenario = __ENV.SCENARIO || 'smoke';

export const options = {
    scenarios: scenarios[selectedScenario] || smokeScenario,
    thresholds: {
        ...defaultThresholds,
        'http_req_duration{name:auth_login_valid}': ['p(95)<400'],
        'http_req_duration{name:auth_login_invalid}': ['p(95)<300'],
        'http_req_duration{name:auth_login_missing_fields}': ['p(95)<200'],
    },
};

export default function () {
    const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;

    group('Auth - Login com credenciais válidas', () => {
        const payload = JSON.stringify({
            email: env.adminEmail,
            password: env.adminPassword,
        });

        const res = http.post(`${env.baseUrl}/auth/login`, payload, {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'auth_login_valid' },
        });

        check(res, {
            'login válido: status 200': (r) => r.status === 200,
            'login válido: retorna token': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.token !== undefined && body.token !== null;
                } catch {
                    return false;
                }
            },
            'login válido: retorna dados do usuário': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.user && body.user.email === env.adminEmail;
                } catch {
                    return false;
                }
            },
            'login válido: não retorna senha': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.user && body.user.password === undefined;
                } catch {
                    return false;
                }
            },
        });

        sleep(Math.random() * 2 + 1); // think time: 1-3 seconds
    });

    group('Auth - Login com credenciais inválidas', () => {
        const payload = JSON.stringify({
            email: `invalid-${uniqueId}@example.com`,
            password: 'wrongpassword',
        });

        const res = http.post(`${env.baseUrl}/auth/login`, payload, {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'auth_login_invalid' },
        });

        check(res, {
            'login inválido: status 401': (r) => r.status === 401,
            'login inválido: retorna mensagem de erro': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.message === 'Invalid email or password';
                } catch {
                    return false;
                }
            },
        });

        sleep(Math.random() * 1 + 0.5); // think time: 0.5-1.5 seconds
    });

    group('Auth - Login com campos obrigatórios ausentes', () => {
        // Sem email
        const payloadNoEmail = JSON.stringify({
            password: 'somepassword',
        });

        const resNoEmail = http.post(`${env.baseUrl}/auth/login`, payloadNoEmail, {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'auth_login_missing_fields' },
        });

        check(resNoEmail, {
            'sem email: status 400': (r) => r.status === 400,
            'sem email: retorna mensagem de erro': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.message === 'Email and password are required';
                } catch {
                    return false;
                }
            },
        });

        // Sem senha
        const payloadNoPassword = JSON.stringify({
            email: 'admin@example.com',
        });

        const resNoPassword = http.post(`${env.baseUrl}/auth/login`, payloadNoPassword, {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'auth_login_missing_fields' },
        });

        check(resNoPassword, {
            'sem senha: status 400': (r) => r.status === 400,
            'sem senha: retorna mensagem de erro': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.message === 'Email and password are required';
                } catch {
                    return false;
                }
            },
        });

        // Body vazio
        const resEmpty = http.post(`${env.baseUrl}/auth/login`, '{}', {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'auth_login_missing_fields' },
        });

        check(resEmpty, {
            'body vazio: status 400': (r) => r.status === 400,
        });

        sleep(Math.random() * 1 + 0.5); // think time: 0.5-1.5 seconds
    });

    group('Auth - Login seguido de requisição autenticada', () => {
        // Login
        const loginPayload = JSON.stringify({
            email: env.adminEmail,
            password: env.adminPassword,
        });

        const loginRes = http.post(`${env.baseUrl}/auth/login`, loginPayload, {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'auth_login_valid' },
        });

        const loginOk = check(loginRes, {
            'fluxo autenticado: login status 200': (r) => r.status === 200,
        });

        if (loginOk) {
            const token = JSON.parse(loginRes.body).token;

            sleep(Math.random() * 1 + 0.5);

            // Usar o token para listar usuários
            const usersRes = http.get(`${env.baseUrl}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                tags: { name: 'auth_flow_list_users' },
            });

            check(usersRes, {
                'fluxo autenticado: listar usuários status 200': (r) => r.status === 200,
                'fluxo autenticado: retorna array': (r) => {
                    try {
                        return Array.isArray(JSON.parse(r.body));
                    } catch {
                        return false;
                    }
                },
            });
        }

        sleep(Math.random() * 2 + 1); // think time: 1-3 seconds
    });
}
