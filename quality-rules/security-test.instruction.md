# 🔐 Política de Geração de Testes de Segurança para APIs

## 🎯 Objetivo

Este documento define as regras obrigatórias para geração automatizada de testes de segurança da API, garantindo:

- Identificação de vulnerabilidades comuns
- Conformidade com boas práticas (OWASP API Security Top 10)
- Execução automatizada em ambiente local e CI
- Falha automática da pipeline em caso de vulnerabilidade crítica
- Alinhamento com regras formais de negócio e autenticação

---

# 🧠 Papel do Agente de Segurança

Ao gerar testes de segurança, o agente deve:

1. Analisar:
   - Documentação formal de regras de negócio
   - Contratos definidos fora do Swagger
   - Regras de autenticação (Bearer Token)
   - Regras de autorização (roles, permissões)
   - Fluxos críticos

2. Identificar:
   - Pontos de entrada sensíveis
   - Endpoints autenticados
   - Operações de escrita (POST, PUT, PATCH, DELETE)
   - Dados sensíveis

3. Gerar:
   - Testes negativos
   - Testes de autorização
   - Testes de validação
   - Testes contra vulnerabilidades conhecidas

---

# 📥 Entradas Obrigatórias

O agente deve utilizar:

- Documentação formal de regras de negócio
- Contratos oficiais da API
- Política de autenticação
- Política de autorização
- Requisitos de segurança definidos no projeto

Nunca basear-se apenas no Swagger.

---

# 🛡️ Base Conceitual Obrigatória

Os testes devem considerar a OWASP API Security Top 10:

- Broken Object Level Authorization (BOLA)
- Broken Authentication
- Excessive Data Exposure
- Lack of Rate Limiting
- Mass Assignment
- Security Misconfiguration
- Injection
- Improper Assets Management
- Insufficient Logging & Monitoring
- SSRF

---

# 📁 Estrutura Obrigatória

security/
│
├── helpers/
│ └── auth.js
│
├── tests/
│ ├── authentication.security.test.js
│ ├── authorization.security.test.js
│ ├── injection.security.test.js
│ ├── rate-limit.security.test.js
│ └── validation.security.test.js
│
└── security.config.js

---

# 🔐 Tipos de Testes Obrigatórios

## 1️⃣ Testes de Autenticação

O agente deve validar:

- Acesso sem token → deve retornar 401
- Token inválido → deve retornar 401
- Token expirado → deve retornar 401
- Token malformado → deve retornar erro apropriado

---

## 2️⃣ Testes de Autorização

O agente deve validar:

- Usuário sem permissão não pode acessar recurso
- Usuário não pode acessar recurso de outro usuário
- Endpoint deve retornar 403 quando apropriado
- Tentativas de manipulação de ID devem falhar

---

## 3️⃣ Testes de Validação de Entrada

O agente deve testar:

- Campos obrigatórios ausentes
- Tipos incorretos
- Strings excessivamente longas
- Valores fora do range permitido
- Dados malformados (JSON inválido)

---

## 4️⃣ Testes de Injection

O agente deve testar tentativas de:

- SQL Injection
- NoSQL Injection
- Command Injection
- Script Injection

Exemplos de payloads:

- `' OR 1=1 --`
- `{ "$ne": null }`
- `"; DROP TABLE users;`
- `<script>alert(1)</script>`

---

## 5️⃣ Testes de Mass Assignment

O agente deve:

- Enviar campos não documentados
- Verificar se campos sensíveis podem ser alterados
- Validar que propriedades internas não são expostas

---

## 6️⃣ Testes de Rate Limiting

Se a API possuir limitação de requisição:

- Enviar múltiplas requisições rapidamente
- Validar retorno 429
- Validar headers de limite

---

## 7️⃣ Exposição de Dados Sensíveis

O agente deve validar:

- Senhas não retornadas em respostas
- Tokens não expostos
- Campos internos não retornados
- Stack traces não expostos em erros

---

# ⚙️ Ferramentas Recomendadas

O agente pode gerar testes utilizando:

- Jest + Supertest (testes programáticos)
- k6 (para rate limiting)
- OWASP ZAP (scan automatizado via pipeline)
- npm audit (análise de dependências)

---

# 🚫 Anti-Padrões Proibidos

O agente não deve:

- Ignorar endpoints autenticados
- Testar apenas cenários felizes
- Confiar apenas em status 200
- Hardcode tokens reais
- Testar produção sem autorização

---

# 🚀 Execução Local

Os testes devem poder ser executados via:

npm run test:security

ou

jest security/

Devem suportar:

- Variáveis de ambiente
- Configuração de base URL
- Token dinâmico

---

# 🔄 Execução na Pipeline (GitHub Actions)

A pipeline deve:

- Executar testes de segurança
- Executar auditoria de dependências
- Executar scan automatizado (quando configurado)
- Falhar em caso de vulnerabilidade crítica ou alta

Exemplo esperado:

npm audit --audit-level=high
npm run test:security

A pipeline deve falhar se:

- Vulnerabilidade High ou Critical encontrada
- Endpoint retornar 200 quando deveria bloquear
- Dados sensíveis forem expostos
- Autorização falhar incorretamente

---

# 📉 Critérios de Aceite

Um teste de segurança é considerado válido quando:

- Cobre autenticação
- Cobre autorização
- Testa inputs inválidos
- Testa injeções
- Valida exposição de dados
- Executa localmente
- Executa em CI
- Falha automaticamente quando vulnerabilidade é detectada

---

# 📌 Definition of Done

- [ ] Testes negativos implementados
- [ ] Testes de autorização implementados
- [ ] Testes de injection implementados
- [ ] Validação de dados sensíveis realizada
- [ ] Rate limiting testado (se aplicável)
- [ ] Execução validada localmente
- [ ] Compatível com GitHub Actions
- [ ] Pipeline falha em caso de risco crítico

---

# 🧭 Filosofia

Testes de segurança não validam apenas se o sistema funciona.

Validam se o sistema:

- Resiste a ataques
- Protege dados
- Aplica corretamente regras de autorização
- Impede manipulações indevidas

Segurança é requisito funcional e não funcional ao mesmo tempo.

Não é opcional.



