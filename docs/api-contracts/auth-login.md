# POST /auth/login

Autentica um usuário e retorna um token JWT.

---

## Endpoint

```
POST /auth/login
```

## Headers

| Header        | Valor              | Obrigatório |
|---------------|-------------------|-------------|
| Content-Type  | application/json  | Sim         |

## Request Body

```json
{
  "email": "admin@example.com",
  "password": "admin123!"
}
```

| Campo      | Tipo     | Obrigatório | Descrição          |
|-----------|----------|-------------|--------------------|
| `email`   | `string` | Sim         | Email do usuário   |
| `password`| `string` | Sim         | Senha do usuário   |

## Responses

### 200 - Autenticação bem-sucedida

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### 400 - Campos obrigatórios ausentes

```json
{
  "message": "Email and password are required"
}
```

### 401 - Credenciais inválidas

```json
{
  "message": "Invalid email or password"
}
```

## Códigos de Status

| Código | Descrição                      |
|--------|-------------------------------|
| 200    | Autenticação bem-sucedida     |
| 400    | Campos obrigatórios ausentes  |
| 401    | Credenciais inválidas         |
