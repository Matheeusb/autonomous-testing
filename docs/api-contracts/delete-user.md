# DELETE /users/:id

Remove um usuário do sistema.

---

## Endpoint

```
DELETE /users/:id
```

## Headers

| Header          | Valor              | Obrigatório |
|-----------------|-------------------|-------------|
| Authorization   | Bearer \<token\>  | Sim         |

## Autorização

- Requer papel **ADMIN**.

## Path Parameters

| Parâmetro | Tipo     | Obrigatório | Descrição           |
|-----------|----------|-------------|---------------------|
| `id`      | `string` | Sim         | ID (UUID) do usuário |

## Request Body

Nenhum.

## Responses

### 204 - Usuário deletado com sucesso

Sem corpo de resposta.

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
| 204    | Usuário deletado com sucesso  |
| 401    | Não autenticado               |
| 403    | Permissão insuficiente        |
| 404    | Usuário não encontrado        |
