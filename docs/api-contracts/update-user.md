# PUT /users/:id

Atualiza os dados de um usuário existente.

---

## Endpoint

```
PUT /users/:id
```

## Headers

| Header          | Valor              | Obrigatório |
|-----------------|-------------------|-------------|
| Content-Type    | application/json  | Sim         |
| Authorization   | Bearer \<token\>  | Sim         |

## Autorização

- Requer papel **ADMIN**.

## Path Parameters

| Parâmetro | Tipo     | Obrigatório | Descrição           |
|-----------|----------|-------------|---------------------|
| `id`      | `string` | Sim         | ID (UUID) do usuário |

## Request Body

Todos os campos são opcionais. Apenas os campos enviados serão atualizados.

```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "age": 26,
  "password": "newpassword123",
  "role": "ADMIN"
}
```

| Campo      | Tipo      | Obrigatório | Descrição                                      |
|-----------|-----------|-------------|------------------------------------------------|
| `name`    | `string`  | Não         | Novo nome do usuário                           |
| `email`   | `string`  | Não         | Novo email (deve ser único)                    |
| `age`     | `integer` | Não         | Nova idade (mínimo 18)                         |
| `password`| `string`  | Não         | Nova senha (mínimo 8 caracteres)               |
| `role`    | `string`  | Não         | Novo papel: `USER` ou `ADMIN`                  |

## Responses

### 200 - Usuário atualizado com sucesso

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Updated",
  "email": "john.updated@example.com",
  "age": 26,
  "role": "ADMIN",
  "created_at": "2026-02-10T12:00:00.000Z",
  "updated_at": "2026-02-10T13:00:00.000Z"
}
```

### 400 - Erro de validação

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

### 404 - Usuário não encontrado

```json
{
  "message": "User not found"
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
| 200    | Usuário atualizado com sucesso |
| 400    | Erro de validação             |
| 401    | Não autenticado               |
| 403    | Permissão insuficiente        |
| 404    | Usuário não encontrado        |
| 409    | Email já em uso               |
