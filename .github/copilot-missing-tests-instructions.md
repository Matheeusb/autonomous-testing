# Instruções para Criação de Testes Unitários Ausentes – GitHub Copilot

## 🎯 Objetivo

Quando novas funcionalidades forem adicionadas ao código-fonte sem testes unitários correspondentes, o GitHub Copilot deve analisar o código alterado e criar os testes unitários necessários, abrindo um Pull Request com os novos testes.

---

## 🔍 Processo de Análise

### 1. Identificar os arquivos sem cobertura de testes

- Leia a lista de arquivos alterados que não possuem teste correspondente
- Leia a lista de arquivos com cobertura abaixo do threshold
- Analise o código-fonte de cada arquivo identificado

### 2. Analisar o código-fonte

Para cada arquivo sem teste:

- Identifique todas as funções e métodos exportados
- Mapeie as regras de negócio implementadas
- Identifique pontos de decisão (if/else, switch, try/catch)
- Liste as dependências externas que precisam ser mockadas

### 3. Consultar a documentação de referência

Antes de criar os testes, consulte obrigatoriamente:

- `/docs/business-rules.md` – Regras de negócio
- `/docs/domain-model.md` – Modelo de domínio
- `/docs/api-contracts/*` – Contratos da API
- `/quality-rules/unit-test.instructions.md` – Padrões de qualidade dos testes

---

## 🛠️ Regras para Criação de Testes

### Estrutura dos testes

Os testes devem seguir a estrutura existente no projeto:

| Arquivo fonte | Arquivo de teste esperado |
|---------------|--------------------------|
| `src/services/novoService.js` | `tests/unit/services/novoService.test.js` |
| `src/controllers/novoController.js` | `tests/unit/controllers/novoController.test.js` |
| `src/middlewares/novoMiddleware.js` | `tests/unit/middlewares/novoMiddleware.test.js` |

### Cobertura obrigatória

Cada arquivo de teste deve cobrir:

- **Happy path** – Cenários de sucesso para cada função
- **Cenários negativos** – Entradas inválidas, erros esperados
- **Valores limite** – Edge cases relevantes
- **Tratamento de erros** – Exceções e fluxos de erro
- **Cenários de segurança** – Validação de permissões quando aplicável

### Padrões obrigatórios

- Usar **Jest** como framework de testes
- Seguir o padrão **AAA** (Arrange, Act, Assert)
- Nomenclatura: `should <comportamento esperado> when <condição>`
- Mockar dependências externas (repositórios, serviços)
- Não acessar banco de dados real ou serviços externos

### Metas de cobertura

- **Statements:** ≥ 90%
- **Branches:** ≥ 85%
- **Functions:** ≥ 90%

---

## 📝 Formato do Pull Request

O PR criado pelo Copilot deve conter:

### Título
```
test: adiciona testes unitários para [nome do módulo/funcionalidade]
```

### Descrição

```markdown
## Contexto
[Descrição de quais arquivos foram adicionados/modificados sem cobertura de testes]

## Testes Criados
- [ ] `tests/unit/path/arquivo.test.js` – [descrição dos cenários cobertos]

## Cobertura
- Cenários de sucesso: X testes
- Cenários de erro: X testes
- Valores limite: X testes

## Referência
- Issue: #<numero>
- Regras de negócio: [regras específicas cobertas]
```

### Labels
- `copilot-fix`
- `missing-tests`
- `automated`

---

## ⚠️ Situações Especiais

### Quando NÃO criar testes automaticamente

O Copilot **não deve** criar testes e deve apenas comentar na Issue quando:

- O arquivo é apenas de configuração (`src/config/*`)
- O código é gerado automaticamente
- A funcionalidade requer integrações externas complexas para testar
- Há ambiguidade nas regras de negócio que impede a criação de assertions claras

Nesses casos, adicione um comentário na Issue com:
```
⚠️ Testes para [arquivo] requerem análise manual. Motivo: [explicação]
```

### Arquivos com cobertura baixa (mas teste existente)

- Analise o teste existente para identificar cenários faltantes
- Adicione os cenários ausentes ao arquivo de teste existente
- Não crie um novo arquivo de teste separado

---

## 🔄 Validação

Antes de abrir o PR, o Copilot deve:

1. Verificar que todos os novos testes passam
2. Verificar que os testes existentes continuam passando
3. Garantir que os testes seguem os padrões de `/quality-rules/unit-test.instructions.md`
4. Confirmar que a cobertura dos arquivos afetados atingiu o threshold mínimo
