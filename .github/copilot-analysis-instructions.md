# Instruções para Análise de Falhas em Testes Unitários – GitHub Copilot

## 🎯 Objetivo

Quando testes unitários falharem na pipeline de CI, o GitHub Copilot deve analisar os resultados e propor correções no **código-fonte** (não nos testes), abrindo um Pull Request com a solução.

---

## 🔍 Processo de Análise

### 1. Identificar os testes que falharam

- Leia o output completo dos testes
- Identifique cada teste que falhou pelo nome (`should ... when ...`)
- Extraia a mensagem de erro e o stack trace

### 2. Classificar o tipo de falha

Classifique cada falha em uma das categorias:

| Categoria | Descrição | Ação |
|-----------|-----------|------|
| **Bug no código-fonte** | O teste está correto, mas o código-fonte tem um defeito | Corrigir o código-fonte |
| **Regra de negócio não implementada** | O teste valida uma regra documentada que não foi implementada | Implementar a regra no código-fonte |
| **Regressão** | Código que funcionava anteriormente foi quebrado | Reverter ou corrigir a regressão |
| **Bug no teste** | O teste possui um erro de lógica ou assertion incorreta | Corrigir o teste |

### 3. Analisar a causa raiz

Para cada falha:

- Compare o comportamento esperado (assertion) com o comportamento real (output)
- Consulte os arquivos de referência:
  - `/docs/business-rules.md` – Regras de negócio
  - `/docs/domain-model.md` – Modelo de domínio
  - `/docs/api-contracts/*` – Contratos da API
  - `/quality-rules/unit-test.instructions.md` – Padrões de qualidade dos testes
- Identifique o arquivo e a linha exata que precisa ser corrigida

---

## 🛠️ Regras para Correção

### Prioridade de correção

1. **Prefira corrigir o código-fonte**, não os testes
2. Corrija testes **somente** se o teste estiver claramente errado (assertion incorreta, mock mal configurado, etc.)
3. Se uma regra de negócio descrita na documentação não estiver implementada, **implemente-a**

### Escopo permitido para alterações

Arquivos que podem ser alterados:

- `src/services/*.js` – Lógica de negócio
- `src/controllers/*.js` – Controllers
- `src/middlewares/*.js` – Middlewares
- `src/repositories/*.js` – Repositórios

Arquivos que **só devem ser alterados se o teste estiver incorreto**:

- `tests/**/*.test.js`

Arquivos que **nunca devem ser alterados**:

- `docs/*` – Documentação de referência
- `quality-rules/*` – Instruções de qualidade
- `.github/*` – Configurações de CI
- `package.json` – Dependências
- `src/config/*` – Configurações

### Princípios de correção

- Cada correção deve ser **mínima e focada** – altere apenas o necessário
- Não introduza novas dependências
- Mantenha compatibilidade com os contratos da API documentados
- Siga os padrões de código já existentes no projeto
- Não suprima erros ou ignore validações para fazer testes passarem

---

## 📝 Formato do Pull Request

O PR criado pelo Copilot deve conter:

### Título
```
fix: [descrição concisa do problema corrigido]
```

### Descrição

```markdown
## Problema
[Descrição clara do que estava falhando]

## Causa Raiz
[Explicação técnica da causa da falha]

## Correção
[Descrição das alterações realizadas]

## Testes Afetados
- [ ] `nome do teste 1`
- [ ] `nome do teste 2`

## Referência
- Issue: #<numero>
- Regras de negócio: [regra específica, se aplicável]
```

### Labels
- `copilot-fix`
- `automated`

---

## ⚠️ Situações Especiais

### Quando NÃO corrigir automaticamente

O Copilot **não deve** tentar corrigir e deve apenas comentar na Issue quando:

- A falha envolve problemas de infraestrutura (timeout, memória, etc.)
- A correção exige mudanças arquiteturais significativas
- Há ambiguidade entre a documentação e o código (conflito de requisitos)
- A cobertura de testes está abaixo do threshold mas todos os testes passam

Nesses casos, adicione um comentário na Issue com:
```
⚠️ Esta falha requer análise manual. Motivo: [explicação]
```

### Múltiplas falhas relacionadas

- Agrupe falhas com a mesma causa raiz em uma única correção
- Se houver falhas independentes, priorize pela criticidade

---

## 📊 Análise de Cobertura

Se o output incluir relatório de cobertura, analise também:

- Se a cobertura está abaixo dos thresholds definidos:
  - Statements: 90%
  - Branches: 85%
  - Functions: 90%
- Identifique quais arquivos/funções estão com cobertura baixa
- Sugira (mas **não implemente**) novos testes para cobrir gaps

---

## 🔄 Validação

Antes de abrir o PR, o Copilot deve:

1. Verificar que as alterações não quebram outros testes
2. Garantir que o código segue os padrões existentes
3. Confirmar que a correção está alinhada com a documentação de referência
