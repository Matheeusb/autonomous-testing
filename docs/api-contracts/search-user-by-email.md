# GET /users/search-by-email

Busca um usuário pelo endereço de e-mail.

---

## Endpoint

```
GET /users/search-by-email?email=<email>
```

## Headers

| Header          | Valor              | Obrigatório |
|-----------------|-------------------|-------------|
| Authorization   | Bearer \<token\>  | Sim         |

## Autorização

- Requer autenticação. Qualquer papel autenticado pode acessar.

## Query Parameters

| Parâmetro | Tipo     | Obrigatório | Descrição                        |
|-----------|----------|-------------|----------------------------------|
| `email`   | `string` | Sim         | Endereço de e-mail a ser buscado |

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

### 400 - Parâmetro obrigatório ausente ou formato inválido

```json
{
  "message": "Email query parameter is required"
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

### 404 - Usuário não encontrado

```json
{
  "message": "User not found"
}
```

## Códigos de Status

| Código | Descrição                               |
|--------|-----------------------------------------|
| 200    | Usuário encontrado                      |
| 400    | Parâmetro `email` ausente ou inválido   |
| 401    | Não autenticado                         |
| 404    | Usuário não encontrado                  |
