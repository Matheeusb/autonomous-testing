# Modelo de Domínio

Este documento descreve a entidade principal do sistema e seus atributos.

---

## Entidade: User

Representa um usuário do sistema.

| Campo        | Tipo     | Obrigatório | Descrição                                               |
|-------------|----------|-------------|---------------------------------------------------------|
| `id`        | `string` | Sim (auto)  | Identificador único do usuário (UUID v4, gerado automaticamente) |
| `name`      | `string` | Sim         | Nome completo do usuário                                |
| `email`     | `string` | Sim         | Email do usuário. Deve ser único no sistema             |
| `age`       | `number` | Sim         | Idade do usuário. Deve ser um inteiro >= 18             |
| `password`  | `string` | Sim         | Senha do usuário. Mínimo de 8 caracteres. Armazenada como hash |
| `role`      | `string` | Não         | Papel do usuário no sistema. Valores: `USER` ou `ADMIN`. Padrão: `USER` |
| `created_at`| `string` | Sim (auto)  | Data e hora de criação do registro (ISO 8601)           |
| `updated_at`| `string` | Sim (auto)  | Data e hora da última atualização (ISO 8601)            |

### Observações

- O campo `password` nunca é exposto nas respostas da API.
- O campo `id` é gerado automaticamente pelo sistema no formato UUID v4.
- Os campos `created_at` e `updated_at` são gerenciados automaticamente pelo sistema.
- O campo `role` aceita apenas os valores `USER` e `ADMIN`.
