# GitHub Copilot – Instruções para Geração de Testes Unitários

## 🎯 Objetivo

Estas instruções orientam o GitHub Copilot a gerar **testes unitários de alta qualidade** para esta API em Node.js, com base em:

* **Código-fonte existente**
* **Documentação de regras de negócio** (`/docs/business-rules.md`)
* **Modelo de domínio** (`/docs/domain-model.md`)
* **Contratos da API** (`/docs/api-contracts/*`)

O objetivo principal é maximizar **confiança no sistema, cobertura efetiva e detecção de defeitos**, e não apenas atingir métricas de cobertura superficial.

Estas instruções devem funcionar tanto para:

* **Execução local** (uso do GitHub Copilot pelo desenvolvedor)
* **Execução em pipeline CI** via **GitHub Actions**

---

## 🧠 Filosofia de Testes Unitários

Ao gerar testes unitários, siga rigorosamente os princípios abaixo:

* Testes unitários validam **comportamento**, não detalhes de implementação
* Cada teste deve ter **um único objetivo claro**
* Testes devem ser:

  * Determinísticos
  * Rápidos
  * Isolados
* Dependências externas devem ser **mockadas ou simuladas**

Testes unitários são a **primeira linha de defesa** do sistema de Autonomous Testing.

---

## 🛠️ Stack Obrigatória de Testes

Utilize as ferramentas abaixo, a menos que o projeto já defina explicitamente alternativas:

* **Jest** – runner de testes e assertions
* **Supertest (mockado)** – apenas quando necessário para testes de controllers
* **Mocks do Jest ou Sinon** – para simular dependências

Não é permitido:

* Acessar banco de dados real
* Consumir serviços externos reais
* Depender de dados específicos de ambiente

---

## 📂 Escopo e Estrutura dos Testes

Os testes unitários devem ser gerados prioritariamente para as seguintes camadas:

### 1️⃣ Services (Prioridade Máxima)

Testar:

* Regras de negócio
* Validações
* Tratamento de erros

Mockar:

* Repositórios
* Dependências externas

---

### 2️⃣ Controllers

Testar:

* Mapeamento request → response
* Códigos de status HTTP
* Decisões de autorização

Mockar:

* Services

---

### 3️⃣ Middlewares

Testar:

* Autenticação
* Autorização
* Cenários de erro

---

## 📚 Uso Obrigatório da Documentação

Antes de escrever qualquer teste, **analise obrigatoriamente**:

* `/docs/business-rules.md`
* `/docs/domain-model.md`
* `/docs/api-contracts/*`

Todas as regras de negócio descritas na documentação devem ser:

* Explicitamente testadas
* Cobertas com **cenários positivos e negativos**

Se uma regra existir na documentação, mas **não estiver implementada no código**:

* Crie um **teste falhando** para evidenciar a lacuna

---

## 🧪 Técnicas Avançadas de Testes (Obrigatórias)

Sempre que aplicável, utilize as técnicas abaixo:

### ✅ Particionamento em Classes de Equivalência

* Entradas válidas vs inválidas
* Usuários autorizados vs não autorizados

### ✅ Análise de Valores Limite

* Idade mínima (17 / 18)
* Tamanho mínimo de senha (7 / 8 caracteres)

### ✅ Testes Negativos

* Campos obrigatórios ausentes
* Tipos inválidos
* Acesso não autorizado

### ✅ Error Guessing

* Valores `null` ou `undefined`
* Papéis (roles) inesperados

### ✅ Testes Amigáveis a Mutation Testing

* Assertions devem validar o **resultado**, não a implementação

---

## 🔐 Testes Unitários com Foco em Segurança

Incluir testes unitários para os seguintes cenários:

* Ausência do Bearer Token
* Token inválido
* Token expirado (se aplicável)
* Usuário com role `USER` acessando funcionalidades restritas a `ADMIN`

Esses testes devem ser implementados **sem uso de ferramentas externas de segurança**.

---

## 📊 Requisitos de Cobertura

Cobertura mínima esperada:

* **Statements:** 90%
* **Branches:** 85%
* **Functions:** 90%

A cobertura deve priorizar:

* Pontos de decisão
* Fluxos de erro
* Regras de negócio críticas

Evite testes artificiais criados apenas para inflar métricas de cobertura.

---

## 🧩 Diretrizes de Mocking

* Mockar apenas o necessário
* Priorizar mocking nas **bordas do sistema** (repositórios, adapters)
* Evitar mocks profundos ou encadeados

Se o mocking se tornar complexo demais:

* Refatore o código sob teste

---

## 🧼 Legibilidade e Padronização dos Testes

Todos os testes devem seguir o padrão **AAA**:

* Arrange
* Act
* Assert

Convenção de nomes dos testes:

```
should <comportamento esperado> when <condição>
```

Exemplo:

```
should throw error when user age is below 18
```

---

## 🔄 Compatibilidade com CI / GitHub Actions

Os testes devem:

* Ser executáveis via `npm test`
* Não depender de:

  * Caminhos locais
  * Comportamentos específicos de SO
  * Configuração manual

Utilizar:

* `.env.test` quando variáveis de ambiente forem necessárias
* Portas padrão e armazenamento em memória

Os testes devem ser:

* Idempotentes
* Seguros para execução em paralelo

---

## 🤖 Expectativas para Autonomous Testing

Os testes unitários gerados devem permitir:

* Refatoração automática por agentes de IA
* Análise clara de falhas
* Comparação histórica entre execuções

Quando um teste falhar:

* A mensagem de erro deve ser clara
* As assertions devem explicar **por que** o teste falhou

---

## 🚫 Anti‑Patterns Proibidos

Não é permitido:

* Testar métodos privados diretamente
* Validar variáveis internas
* Usar dados aleatórios sem seed fixa
* Suprimir ou silenciar erros

---

## 📦 Resultado Esperado do GitHub Copilot

Seguindo estas instruções, o GitHub Copilot deve:

* Gerar testes unitários alinhados às regras de negócio
* Cobrir happy paths, edge cases e cenários negativos
* Produzir testes legíveis, manuteníveis e confiáveis
* Aumentar significativamente a confiança no comportamento do sistema

Estes testes unitários são um **pilar fundamental** do pipeline de Autonomous Testing.
