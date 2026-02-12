# Regras de Negócio

Este documento descreve todas as regras de negócio da API de gerenciamento de usuários.

---

## 1. Autenticação

- Todo acesso aos endpoints de negócio exige autenticação via token JWT.
- O token deve ser enviado no header `Authorization` no formato `Bearer <token>`.
- Tokens expiram após 1 hora.
- O login é realizado com email e senha válidos.

## 2. Autorização por Papel (Role)

A API possui dois papéis de usuário:

| Papel   | Permissões                                                  |
|---------|-------------------------------------------------------------|
| `ADMIN` | Criar, listar todos, consultar, atualizar e deletar usuários |
| `USER`  | Consultar apenas seus próprios dados                        |

### Detalhamento:

- **Apenas ADMIN** pode:
  - Criar novos usuários (`POST /users`)
  - Atualizar dados de qualquer usuário (`PUT /users/:id`)
  - Deletar qualquer usuário (`DELETE /users/:id`)
  - Listar todos os usuários (`GET /users`)
  - Consultar qualquer usuário por ID (`GET /users/:id`)

- **USER** pode:
  - Listar apenas seus próprios dados ao acessar `GET /users`
  - Consultar apenas seu próprio perfil via `GET /users/:id` (onde `:id` é o seu próprio ID)
  - Qualquer tentativa de acessar dados de outro usuário resulta em erro 403

## 3. Cadastro de Usuário

- O campo `email` deve ser único no sistema. Tentativas de cadastro com email já existente resultam em erro 409.
- O campo `password` deve conter no mínimo **8 caracteres**. Senhas com menos caracteres são rejeitadas com erro 400.
- O campo `age` deve ser um número inteiro igual ou superior a **18**. Usuários menores de 18 anos não podem ser cadastrados (erro 400).
- O campo `name` é obrigatório.
- O campo `email` deve ter um formato válido de email.
- O campo `role` é opcional e assume o valor `USER` por padrão.

## 4. Atualização de Usuário

- Se o campo `email` for alterado, o novo email deve ser único no sistema.
- Se o campo `password` for alterado, a nova senha deve respeitar o mínimo de 8 caracteres.
- Se o campo `age` for alterado, o novo valor deve ser igual ou superior a 18.
- A senha é sempre armazenada de forma criptografada (hash).

## 5. Exclusão de Usuário

- Apenas administradores podem excluir usuários.
- Ao excluir um usuário, seus dados são permanentemente removidos do sistema.

## 6. Dados Sensíveis

- A senha do usuário nunca é retornada em nenhuma resposta da API.
- As senhas são armazenadas utilizando hash bcrypt.

## 7. Usuário Inicial

- O sistema é inicializado com um usuário administrador padrão:
  - **Email:** `admin@example.com`
  - **Senha:** `admin123!`
  - **Role:** `ADMIN`
