# GET /users/:id

Retorna os dados de um usuário específico.

---

## Endpoint

```
GET /users/:id
```

## Headers

| Header          | Valor              | Obrigatório |
|-----------------|-------------------|-------------|
| Authorization   | Bearer \<token\>  | Sim         |

## Autorização

- **ADMIN**: pode consultar qualquer usuário.
- **USER**: pode consultar apenas seus próprios dados. Tentativa de consultar outro usuário retorna 403.

## Path Parameters

| Parâmetro | Tipo     | Obrigatório | Descrição           |
|-----------|----------|-------------|---------------------|
| `id`      | `string` | Sim         | ID (UUID) do usuário |

## Request Body

Nenhum.

## Responses

### 200 - Usuário encontrado

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

## Códigos de Status

| Código | Descrição                      |
|--------|-------------------------------|
| 200    | Usuário encontrado            |
| 401    | Não autenticado               |
| 403    | Permissão insuficiente        |
| 404    | Usuário não encontrado        |
