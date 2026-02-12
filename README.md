# Autonomous Testing API

REST API para gerenciamento de usuários com autenticação JWT, criada como base para experimentos de Autonomous Testing.

## Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Autenticação:** JWT (jsonwebtoken)
- **Banco de Dados:** SQLite (better-sqlite3)
- **Documentação:** Swagger (swagger-jsdoc + swagger-ui-express)

## Pré-requisitos

- Node.js >= 18.x
- npm >= 9.x

## Instalação

```bash
# Clonar o repositório
git clone <repo-url>
cd autonomous-testing

# Instalar dependências
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto (um já é fornecido como exemplo):

```env
PORT=3000
JWT_SECRET=autonomous-testing-secret-key-2026
JWT_EXPIRES_IN=1h
```

## Executando

```bash
# Modo produção
npm start

# Modo desenvolvimento (com hot-reload)
npm run dev
```

O servidor será iniciado em `http://localhost:3000`.

## Documentação Swagger

Acesse a documentação interativa dos endpoints em:

```
http://localhost:3000/api-docs
```

## Usuário Padrão

O sistema cria automaticamente um usuário administrador na primeira execução:

| Campo    | Valor              |
|----------|--------------------|
| Email    | admin@example.com  |
| Senha    | admin123!          |
| Role     | ADMIN              |

## Endpoints

### Autenticação

| Método | Endpoint      | Descrição                |
|--------|--------------|--------------------------|
| POST   | /auth/login  | Autenticar e obter token |

### Usuários

| Método | Endpoint      | Descrição            | Autorização |
|--------|--------------|----------------------|-------------|
| GET    | /users       | Listar usuários      | AUTH        |
| GET    | /users/:id   | Buscar por ID        | AUTH        |
| POST   | /users       | Criar usuário        | ADMIN       |
| PUT    | /users/:id   | Atualizar usuário    | ADMIN       |
| DELETE | /users/:id   | Deletar usuário      | ADMIN       |

## Exemplos de Payloads

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123!"
  }'
```

### Criar Usuário

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25,
    "password": "password123",
    "role": "USER"
  }'
```

### Listar Usuários

```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer <token>"
```

### Buscar Usuário por ID

```bash
curl http://localhost:3000/users/<id> \
  -H "Authorization: Bearer <token>"
```

### Atualizar Usuário

```bash
curl -X PUT http://localhost:3000/users/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "John Updated",
    "age": 26
  }'
```

### Deletar Usuário

```bash
curl -X DELETE http://localhost:3000/users/<id> \
  -H "Authorization: Bearer <token>"
```

## Estrutura do Projeto

```
├── docs/
│   ├── business-rules.md          # Regras de negócio
│   ├── domain-model.md            # Modelo de domínio
│   └── api-contracts/             # Contratos da API
│       ├── auth-login.md
│       ├── create-user.md
│       ├── delete-user.md
│       ├── get-user.md
│       ├── list-users.md
│       └── update-user.md
├── src/
│   ├── app.js                     # Entry point
│   ├── config/
│   │   ├── database.js            # Configuração SQLite
│   │   └── jwt.js                 # Configuração JWT
│   ├── controllers/
│   │   ├── authController.js      # Controller de autenticação
│   │   └── userController.js      # Controller de usuários
│   ├── middlewares/
│   │   ├── auth.js                # Middleware de autenticação JWT
│   │   ├── authorize.js           # Middleware de autorização por role
│   │   └── errorHandler.js        # Middleware de tratamento de erros
│   ├── repositories/
│   │   └── userRepository.js      # Camada de acesso a dados
│   ├── routes/
│   │   ├── authRoutes.js          # Rotas de autenticação
│   │   └── userRoutes.js          # Rotas de usuários
│   ├── services/
│   │   ├── authService.js         # Lógica de autenticação
│   │   └── userService.js         # Lógica de negócio de usuários
│   └── swagger/
│       └── swagger.js             # Configuração Swagger
├── .env                           # Variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

## Documentação

- [Regras de Negócio](docs/business-rules.md)
- [Modelo de Domínio](docs/domain-model.md)
- [Contratos da API](docs/api-contracts/)

## Licença

ISC
