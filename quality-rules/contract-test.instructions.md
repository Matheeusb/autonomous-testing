# GitHub Copilot – Instruções para Geração de Testes de Contrato com Pact

## 🎯 Objetivo

Estas instruções orientam o GitHub Copilot a gerar **testes de contrato utilizando o framework Pact** para esta API Node.js.

Os testes de contrato devem ser baseados em:

* Código-fonte da API
* `/docs/api-contracts/*` (FONTE DA VERDADE)
* `/docs/business-rules.md`
* `/docs/domain-model.md`

O Swagger **não deve ser utilizado como fonte primária de contrato**.

Os testes devem funcionar tanto para:

* Execução local
* Execução automatizada via GitHub Actions

O objetivo é garantir **estabilidade de integração, compatibilidade evolutiva e prevenção de quebras de contrato**.

---

## 🧠 Filosofia de Testes de Contrato

Testes de contrato devem validar:

* Estrutura de request
* Estrutura de response
* Tipos de dados
* Campos obrigatórios
* Códigos de status HTTP

Eles NÃO devem validar:

* Regras de negócio internas
* Implementação de lógica
* Detalhes internos de banco de dados

Contrato valida **acordo entre consumidor e provedor**, não comportamento interno.

---

## 🛠️ Stack Obrigatória

Utilizar:

* `@pact-foundation/pact`
* Jest como test runner

Configuração padrão:

* Pact v4
* Geração de arquivos `.json` de contrato
* Diretório padrão: `/pacts`

Não utilizar:

* Testes HTTP reais contra ambientes externos
* Dados dependentes de ambiente específico

---

## 📂 Estrutura Esperada

Criar estrutura semelhante a:

```
/tests/contract/
  users.contract.test.js
/pacts/
```

Os testes devem:

* Criar um mock provider via Pact
* Definir interações explícitas
* Validar requests e responses

---

## 📚 Uso Obrigatório da Documentação

Antes de gerar qualquer teste de contrato, analisar:

* `/docs/api-contracts/*` → FONTE DA VERDADE
* `/docs/domain-model.md`

Os contratos documentados devem ser refletidos explicitamente nas interações Pact.

Se houver divergência entre código e contrato documentado:

* Gerar teste evidenciando a inconsistência
* Priorizar o contrato documentado

---

## 🧩 Diretrizes para Definição de Interações

Cada endpoint deve possuir:

* Pelo menos 1 cenário de sucesso
* Pelo menos 1 cenário de erro

As interações devem incluir:

### ✅ Descrição clara

```
describe('Contrato - POST /users')
```

### ✅ Given (estado do provider)

Definir estado esperado do sistema

### ✅ Upon Receiving

* Método HTTP
* Endpoint
* Headers obrigatórios
* Body (quando aplicável)

### ✅ Will Respond With

* Status code
* Headers
* Body estruturado

---

## 🧪 Uso de Matchers (Obrigatório)

Não utilizar valores fixos quando o tipo for relevante.

Utilizar matchers do Pact:

* `like()` para tipos
* `eachLike()` para listas
* `term()` para regex (ex: email)

Exemplo esperado:

* id como número (não valor fixo)
* email validado por regex

Evitar contratos frágeis baseados em valores exatos.

---

## 🔐 Testes de Contrato para Segurança

Incluir contratos para:

* Requisições sem Authorization header
* Token inválido
* Acesso proibido (403)

Contrato deve refletir apenas:

* Estrutura da resposta
* Status esperado

Não validar lógica interna de autenticação.

---

## 🔄 Consumer-Driven Contract (CDC)

Assumir abordagem Consumer-Driven Contract:

* Cada interação representa expectativa de um consumidor
* Contratos devem ser versionáveis
* Alterações devem ser retrocompatíveis

Quebras de contrato devem:

* Falhar no CI
* Impedir merge

---

## 📊 Requisitos de Cobertura de Contrato

Todos os endpoints documentados devem possuir:

* Teste de sucesso
* Teste de erro
* Validação de estrutura completa

Não é aceitável possuir endpoint documentado sem contrato Pact correspondente.

---

## 🧼 Boas Práticas

* Uma interação por comportamento relevante
* Nomear testes de forma descritiva
* Evitar contratos duplicados
* Manter interações pequenas e focadas

Padrão de nome:

```
should return <status> when <condição>
```

---

## 🔄 Compatibilidade com GitHub Actions

Os testes devem:

* Rodar com `npm run test:contract`
* Gerar arquivos de contrato automaticamente
* Não depender de portas fixas
* Ser paralelizáveis

Pipeline deve:

1. Executar testes de contrato
2. Gerar arquivos Pact
3. Publicar artefatos (opcional)

---

## 🤖 Expectativas para Autonomous Testing

Os testes de contrato devem permitir:

* Geração automática de novos contratos quando documentação mudar
* Detecção automática de quebra de compatibilidade
* Comparação entre versões anteriores de contrato

Testes devem falhar de forma clara quando:

* Estrutura mudar
* Campo obrigatório for removido
* Tipo for alterado

---

## 🚫 Anti-Patterns Proibidos

Não é permitido:

* Usar Swagger como única fonte de contrato
* Fixar valores quando tipo é suficiente
* Misturar lógica de negócio com contrato
* Ignorar status codes de erro

---

## 📦 Resultado Esperado do GitHub Copilot

Seguindo estas instruções, o GitHub Copilot deve:

* Gerar testes Pact alinhados aos contratos documentados
* Produzir contratos resilientes e evolutivos
* Garantir segurança de integração
* Suportar pipeline de Autonomous Testing

Os testes de contrato são o **mecanismo de proteção contra quebras de integração** dentro do ecossistema da API.
