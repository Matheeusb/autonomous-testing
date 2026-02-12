# POST /users

Cria um novo usuário no sistema.

---

## Endpoint

```
POST /users
```

## Headers

| Header          | Valor              | Obrigatório |
|-----------------|-------------------|-------------|
| Content-Type    | application/json  | Sim         |
| Authorization   | Bearer \<token\>  | Sim         |

## Autorização

- Requer papel **ADMIN**.

## Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 25,
  "password": "password123",
  "role": "USER"
}
```

| Campo      | Tipo      | Obrigatório | Descrição                                      |
|-----------|-----------|-------------|------------------------------------------------|
| `name`    | `string`  | Sim         | Nome completo do usuário                       |
| `email`   | `string`  | Sim         | Email do usuário (deve ser único)              |
| `age`     | `integer` | Sim         | Idade do usuário (mínimo 18)                   |
| `password`| `string`  | Sim         | Senha do usuário (mínimo 8 caracteres)         |
| `role`    | `string`  | Não         | Papel do usuário: `USER` ou `ADMIN`. Padrão: `USER` |

## Responses

### 201 - Usuário criado com sucesso

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "age": 25,
  "role": "USER",
  "created_at": "2026-02-10T12:00:00.000Z",
  "updated_at": "2026-02-10T12:00:00.000Z"
}
```

### 400 - Erro de validação

```json
{
  "message": "Name, email, age and password are required"
}
```

```json
{
  "message": "Password must be at least 8 characters long"
}
```

```json
{
  "message": "User must be at least 18 years old"
}
```

```json
{
  "message": "Invalid email format"
}
```

### 401 - Não autenticado

```json
{
  "message": "Authorization header is required"
}
```

### 403 - Permissão insuficiente

```json
{
  "message": "Insufficient permissions"
}
```

### 409 - Email já em uso

```json
{
  "message": "Email already in use"
}
```

## Códigos de Status

| Código | Descrição                      |
|--------|-------------------------------|
| 201    | Usuário criado com sucesso    |
| 400    | Erro de validação             |
| 401    | Não autenticado               |
| 403    | Permissão insuficiente        |
| 409    | Email já em uso               |
