# 📘 Política de Geração de Testes de Performance com k6

## 🎯 Objetivo

Este documento define as regras obrigatórias para que o GitHub Copilot (ou agentes de IA) gerem testes de performance utilizando **k6**, garantindo:

- Padronização
- Realismo de cenários
- Confiabilidade de métricas
- Critérios objetivos de falha
- Compatibilidade com execução local e CI (GitHub Actions)
- Alinhamento com regras de negócio documentadas

---

# 🧠 Papel do Agente

Ao gerar testes de performance, o agente deve:

1. Analisar:
   - Documentação de regras de negócio
   - Contratos formais dos endpoints
   - Fluxos funcionais críticos
   - Requisitos não funcionais (SLA, throughput, latência)

2. Identificar:
   - Endpoints críticos
   - Operações mais utilizadas
   - Operações sensíveis (login, criação, atualização, exclusão)

3. Gerar:
   - Cenários realistas
   - Thresholds coerentes
   - Scripts organizados e reutilizáveis
   - Testes independentes e reproduzíveis

---

# 📥 Entradas Obrigatórias

O agente deve utilizar como fonte de verdade:

- Documentação formal das regras de negócio
- Contratos definidos fora do Swagger
- Requisitos de SLA definidos no projeto
- Configuração de ambientes (dev, staging, test)

Nunca inferir comportamento apenas pelo Swagger.

---

# 📁 Estrutura Obrigatória de Diretórios

performance/
│
├── config/
│ └── environments.js
│
├── helpers/
│ └── auth.js
│
├── scenarios/
│ ├── smoke.js
│ ├── load.js
│ ├── stress.js
│ └── spike.js
│
├── tests/
│ └── <feature>.load.test.js
│
└── k6.config.js

---

# ⚙️ Estrutura Obrigatória do Script

Todo teste gerado deve conter:

- export const options
- Cenários explícitos
- Thresholds obrigatórios
- Uso de variáveis de ambiente
- Simulação de think time
- Checks funcionais mínimos

---

# 📊 Thresholds Obrigatórios

Os seguintes thresholds devem sempre existir:

http_req_duration: ['p(95)<SLA_MS']
http_req_failed: ['rate<0.01']
checks: ['rate>0.99']


Se o projeto definir SLAs específicos, o agente deve utilizá-los.

---

# 📈 Tipos de Cenários que Devem Ser Criados

## 1. Smoke Performance
- 1 a 5 usuários
- Execução curta
- Valida disponibilidade

## 2. Load Test
- Simula carga esperada de produção
- Ramp-up gradual
- Sustentação mínima de 3 minutos

## 3. Stress Test
- Ultrapassa carga nominal
- Identifica ponto de degradação

## 4. Spike Test
- Crescimento abrupto de usuários
- Mede elasticidade

---

# 🔐 Autenticação

Se a API utiliza Bearer Token:

- O token deve ser obtido dinamicamente
- Nunca hardcode tokens
- Utilizar variável de ambiente
- Modularizar autenticação em helper separado

---

# ⏱️ Simulação de Comportamento Real

O agente deve:

- Utilizar sleep()
- Variar think time
- Agrupar fluxos com group()
- Simular sequência real de uso da API

Exemplo:

- Login
- Criar recurso
- Buscar recurso
- Atualizar recurso
- Deletar recurso

---

# 🧪 Regras de Qualidade

O agente deve garantir:

- Scripts legíveis
- Modularização
- Nenhuma duplicação desnecessária
- Separação de dados de teste
- Não uso de console.log excessivo
- Código compatível com execução em CI

---

# 🚀 Execução Local

Os testes devem poder ser executados via:

k6 run performance/tests/<arquivo>.js


Com suporte a:

-e BASE_URL
-e ENVIRONMENT
-e TOKEN

---

# 🔄 Execução na Pipeline (GitHub Actions)

Os testes devem:

- Exportar relatório JSON
- Falhar automaticamente se thresholds forem violados
- Não depender de interação manual
- Ser executáveis via comando CLI simples

Exemplo esperado:

k6 run performance/tests/load.test.js --summary-export=summary.json

A pipeline deve falhar se:

- SLA for ultrapassado
- Taxa de erro > 1%
- Checks < 99%

---

# ❌ Anti-Padrões Proibidos

O agente não deve:

- Testar produção sem autorização explícita
- Hardcode URLs
- Hardcode tokens
- Criar testes sem thresholds
- Criar testes apenas com GET simples sem simular fluxo real
- Ignorar regras de negócio

---

# 📉 Critérios de Aceite

Um teste de carga só é considerado válido se:

- Simular cenário real
- Conter thresholds definidos
- Executar localmente
- Executar em CI
- Falhar automaticamente quando necessário
- Utilizar autenticação corretamente
- Estiver alinhado às regras de negócio

---

# 📌 Definição de Pronto (Definition of Done)

- [ ] Cenário baseado em fluxo real
- [ ] Thresholds definidos
- [ ] Variáveis de ambiente utilizadas
- [ ] Autenticação modularizada
- [ ] Script organizado
- [ ] Execução validada localmente
- [ ] Compatível com GitHub Actions
- [ ] Relatório exportável

---

# 🧭 Filosofia

Testes de performance não devem medir apenas requisições por segundo.

Devem validar:

- Estabilidade
- Resiliência
- Comportamento sob pressão
- Conformidade com SLA
- Experiência do usuário sob volume

Performance é requisito não funcional crítico e deve ser tratada como parte do contrato do sistema.
