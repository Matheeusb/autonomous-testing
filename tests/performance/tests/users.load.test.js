import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { getEnvironment } from '../config/environments.js';
import { authenticate, getAuthHeaders, getAuthHeadersOnly } from '../helpers/auth.js';
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
        'http_req_duration{name:create_user}': ['p(95)<500'],
        'http_req_duration{name:list_users}': ['p(95)<400'],
        'http_req_duration{name:get_user}': ['p(95)<400'],
        'http_req_duration{name:update_user}': ['p(95)<500'],
        'http_req_duration{name:delete_user}': ['p(95)<400'],
    },
};

/**
 * Setup: authenticates once and shares the token across all VUs.
 */
export function setup() {
    const token = authenticate(env.baseUrl, env.adminEmail, env.adminPassword);
    return { token };
}

export default function (data) {
    const { token } = data;
    const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;
    let createdUserId = null;

    // ── 1. Criar usuário ──────────────────────────────────────────────────
    group('Users - Criar usuário', () => {
        const payload = JSON.stringify({
            name: `Load Test User ${uniqueId}`,
            email: `loadtest-${uniqueId}@example.com`,
            age: 25,
            password: 'password123',
            role: 'USER',
        });

        const res = http.post(`${env.baseUrl}/users`, payload, {
            headers: getAuthHeaders(token),
            tags: { name: 'create_user' },
        });

        const created = check(res, {
            'criar usuário: status 201': (r) => r.status === 201,
            'criar usuário: retorna id': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.id !== undefined;
                } catch {
                    return false;
                }
            },
            'criar usuário: nome correto': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.name === `Load Test User ${uniqueId}`;
                } catch {
                    return false;
                }
            },
            'criar usuário: email correto': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.email === `loadtest-${uniqueId}@example.com`;
                } catch {
                    return false;
                }
            },
            'criar usuário: role USER': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.role === 'USER';
                } catch {
                    return false;
                }
            },
            'criar usuário: não retorna senha': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.password === undefined;
                } catch {
                    return false;
                }
            },
        });

        if (created) {
            createdUserId = JSON.parse(res.body).id;
        }

        sleep(Math.random() * 1 + 0.5); // think time: 0.5-1.5s
    });

    // ── 2. Listar usuários ────────────────────────────────────────────────
    group('Users - Listar usuários', () => {
        const res = http.get(`${env.baseUrl}/users`, {
            headers: getAuthHeadersOnly(token),
            tags: { name: 'list_users' },
        });

        check(res, {
            'listar usuários: status 200': (r) => r.status === 200,
            'listar usuários: retorna array': (r) => {
                try {
                    return Array.isArray(JSON.parse(r.body));
                } catch {
                    return false;
                }
            },
            'listar usuários: array não vazio': (r) => {
                try {
                    return JSON.parse(r.body).length > 0;
                } catch {
                    return false;
                }
            },
        });

        sleep(Math.random() * 1 + 0.5); // think time: 0.5-1.5s
    });

    // ── 3. Consultar usuário por ID ───────────────────────────────────────
    group('Users - Consultar usuário por ID', () => {
        if (!createdUserId) {
            return;
        }

        const res = http.get(`${env.baseUrl}/users/${createdUserId}`, {
            headers: getAuthHeadersOnly(token),
            tags: { name: 'get_user' },
        });

        check(res, {
            'consultar usuário: status 200': (r) => r.status === 200,
            'consultar usuário: id correto': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.id === createdUserId;
                } catch {
                    return false;
                }
            },
            'consultar usuário: não retorna senha': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.password === undefined;
                } catch {
                    return false;
                }
            },
        });

        sleep(Math.random() * 1 + 0.5); // think time: 0.5-1.5s
    });

    // ── 4. Atualizar usuário ──────────────────────────────────────────────
    group('Users - Atualizar usuário', () => {
        if (!createdUserId) {
            return;
        }

        const payload = JSON.stringify({
            name: `Updated User ${uniqueId}`,
            age: 30,
        });

        const res = http.put(`${env.baseUrl}/users/${createdUserId}`, payload, {
            headers: getAuthHeaders(token),
            tags: { name: 'update_user' },
        });

        check(res, {
            'atualizar usuário: status 200': (r) => r.status === 200,
            'atualizar usuário: nome atualizado': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.name === `Updated User ${uniqueId}`;
                } catch {
                    return false;
                }
            },
            'atualizar usuário: idade atualizada': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.age === 30;
                } catch {
                    return false;
                }
            },
            'atualizar usuário: não retorna senha': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.password === undefined;
                } catch {
                    return false;
                }
            },
        });

        sleep(Math.random() * 1 + 0.5); // think time: 0.5-1.5s
    });

    // ── 5. Deletar usuário ────────────────────────────────────────────────
    group('Users - Deletar usuário', () => {
        if (!createdUserId) {
            return;
        }

        const res = http.del(`${env.baseUrl}/users/${createdUserId}`, null, {
            headers: getAuthHeadersOnly(token),
            tags: { name: 'delete_user' },
        });

        check(res, {
            'deletar usuário: status 204': (r) => r.status === 204,
        });

        sleep(Math.random() * 1 + 0.5); // think time: 0.5-1.5s
    });

    // ── 6. Verificar que o usuário foi deletado ────────────────────────────
    group('Users - Verificar exclusão', () => {
        if (!createdUserId) {
            return;
        }

        const res = http.get(`${env.baseUrl}/users/${createdUserId}`, {
            headers: getAuthHeadersOnly(token),
            tags: { name: 'get_user' },
        });

        check(res, {
            'verificar exclusão: status 404': (r) => r.status === 404,
            'verificar exclusão: mensagem user not found': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.message === 'User not found';
                } catch {
                    return false;
                }
            },
        });

        sleep(Math.random() * 1 + 0.5); // think time: 0.5-1.5s
    });

    // ── 7. Validações de negócio ──────────────────────────────────────────
    group('Users - Validação: email duplicado', () => {
        // Tentar criar usuário com email do admin (já existente)
        const payload = JSON.stringify({
            name: 'Duplicate Email User',
            email: env.adminEmail,
            age: 25,
            password: 'password123',
        });

        const res = http.post(`${env.baseUrl}/users`, payload, {
            headers: getAuthHeaders(token),
            tags: { name: 'create_user' },
        });

        check(res, {
            'email duplicado: status 409': (r) => r.status === 409,
        });

        sleep(Math.random() * 0.5 + 0.3); // think time: 0.3-0.8s
    });

    group('Users - Validação: senha curta', () => {
        const payload = JSON.stringify({
            name: 'Short Password User',
            email: `shortpwd-${uniqueId}@example.com`,
            age: 25,
            password: 'short',
        });

        const res = http.post(`${env.baseUrl}/users`, payload, {
            headers: getAuthHeaders(token),
            tags: { name: 'create_user' },
        });

        check(res, {
            'senha curta: status 400': (r) => r.status === 400,
            'senha curta: mensagem correta': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.message === 'Password must be at least 8 characters long';
                } catch {
                    return false;
                }
            },
        });

        sleep(Math.random() * 0.5 + 0.3);
    });

    group('Users - Validação: idade menor que 18', () => {
        const payload = JSON.stringify({
            name: 'Underage User',
            email: `underage-${uniqueId}@example.com`,
            age: 16,
            password: 'password123',
        });

        const res = http.post(`${env.baseUrl}/users`, payload, {
            headers: getAuthHeaders(token),
            tags: { name: 'create_user' },
        });

        check(res, {
            'menor de idade: status 400': (r) => r.status === 400,
            'menor de idade: mensagem correta': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.message === 'User must be at least 18 years old';
                } catch {
                    return false;
                }
            },
        });

        sleep(Math.random() * 0.5 + 0.3);
    });

    group('Users - Validação: campos obrigatórios ausentes', () => {
        const payload = JSON.stringify({
            name: 'Missing Fields User',
        });

        const res = http.post(`${env.baseUrl}/users`, payload, {
            headers: getAuthHeaders(token),
            tags: { name: 'create_user' },
        });

        check(res, {
            'campos ausentes: status 400': (r) => r.status === 400,
        });

        sleep(Math.random() * 0.5 + 0.3);
    });

    // ── 8. Acesso sem autenticação ────────────────────────────────────────
    group('Users - Acesso sem autenticação', () => {
        const res = http.get(`${env.baseUrl}/users`, {
            tags: { name: 'list_users' },
        });

        check(res, {
            'sem auth: status 401': (r) => r.status === 401,
        });

        sleep(Math.random() * 0.5 + 0.3);
    });
}
