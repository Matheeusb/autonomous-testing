# GET /users/search

Busca usuários pelo nome (ou parte do nome).

---

## Endpoint

```
GET /users/search?name=<name>
```

## Headers

| Header          | Valor              | Obrigatório |
|-----------------|-------------------|-------------|
| Authorization   | Bearer \<token\>  | Sim         |

## Autorização

- Requer autenticação. Qualquer papel autenticado pode acessar.

## Query Parameters

| Parâmetro | Tipo     | Obrigatório | Descrição                                |
|-----------|----------|-------------|------------------------------------------|
| `name`    | `string` | Sim         | Nome ou parte do nome do usuário a buscar |

## Request Body

Nenhum.

## Responses

### 200 - Usuários encontrados

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25,
    "role": "USER",
    "created_at": "2026-02-10T12:00:00.000Z",
    "updated_at": "2026-02-10T12:00:00.000Z"
  }
]
```

> Retorna um array vazio `[]` caso nenhum usuário corresponda ao nome buscado.

### 400 - Parâmetro obrigatório ausente

```json
{
  "message": "Name query parameter is required"
}
```

### 401 - Não autenticado

```json
{
  "message": "Authorization header is required"
}
```

## Códigos de Status

| Código | Descrição                              |
|--------|---------------------------------------|
| 200    | Busca realizada com sucesso           |
| 400    | Parâmetro `name` ausente ou inválido  |
| 401    | Não autenticado                       |
