# GET /users

Lista os usuários do sistema.

---

## Endpoint

```
GET /users
```

## Headers

| Header          | Valor              | Obrigatório |
|-----------------|-------------------|-------------|
| Authorization   | Bearer \<token\>  | Sim         |

## Autorização

- **ADMIN**: retorna todos os usuários do sistema.
- **USER**: retorna apenas os dados do próprio usuário autenticado.

## Request Body

Nenhum.

## Responses

### 200 - Lista de usuários

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Admin",
    "email": "admin@example.com",
    "age": 30,
    "role": "ADMIN",
    "created_at": "2026-02-10T12:00:00.000Z",
    "updated_at": "2026-02-10T12:00:00.000Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25,
    "role": "USER",
    "created_at": "2026-02-10T12:00:00.000Z",
    "updated_at": "2026-02-10T12:00:00.000Z"
  }
]
```

### 401 - Não autenticado

```json
{
  "message": "Authorization header is required"
}
```

## Códigos de Status

| Código | Descrição                      |
|--------|-------------------------------|
| 200    | Lista retornada com sucesso   |
| 401    | Não autenticado               |
