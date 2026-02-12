#!/bin/bash

# ============================================================================
# Script de execução dos testes de carga k6
# ============================================================================
#
# Uso:
#   ./performance/run-load-tests.sh [opções]
#
# Opções:
#   --scenario <tipo>     Tipo de cenário: smoke | load | stress | spike (padrão: smoke)
#   --test <arquivo>      Arquivo de teste específico: auth | users | all (padrão: all)
#   --base-url <url>      URL base da API (padrão: http://localhost:3000)
#   --environment <env>   Ambiente: dev | staging | test (padrão: dev)
#   --export              Exportar relatório JSON para CI
#   --help                Mostrar esta ajuda
#
# Exemplos:
#   ./performance/run-load-tests.sh
#   ./performance/run-load-tests.sh --scenario load --test users
#   ./performance/run-load-tests.sh --scenario stress --export
#   ./performance/run-load-tests.sh --base-url http://staging:3000 --scenario load
# ============================================================================

set -e

# ── Defaults ─────────────────────────────────────────────────────────────────
SCENARIO="smoke"
TEST="all"
BASE_URL=""
ENVIRONMENT="dev"
EXPORT=false
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TESTS_DIR="${SCRIPT_DIR}/tests"
RESULTS_DIR="${SCRIPT_DIR}/results"

# ── Parse arguments ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --scenario)
      SCENARIO="$2"
      shift 2
      ;;
    --test)
      TEST="$2"
      shift 2
      ;;
    --base-url)
      BASE_URL="$2"
      shift 2
      ;;
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --export)
      EXPORT=true
      shift
      ;;
    --help)
      head -25 "$0" | tail -22
      exit 0
      ;;
    *)
      echo "Opção desconhecida: $1"
      echo "Use --help para ver as opções disponíveis."
      exit 1
      ;;
  esac
done

# ── Validate scenario ───────────────────────────────────────────────────────
if [[ ! "$SCENARIO" =~ ^(smoke|load|stress|spike)$ ]]; then
  echo "Cenário inválido: $SCENARIO"
  echo "Cenários disponíveis: smoke, load, stress, spike"
  exit 1
fi

# ── Validate test ────────────────────────────────────────────────────────────
if [[ ! "$TEST" =~ ^(auth|users|all)$ ]]; then
  echo "Teste inválido: $TEST"
  echo "Testes disponíveis: auth, users, all"
  exit 1
fi

# ── Check k6 is installed ───────────────────────────────────────────────────
if ! command -v k6 &> /dev/null; then
  echo "k6 não encontrado. Instale via:"
  echo "  macOS:  brew install k6"
  echo "  Linux:  https://grafana.com/docs/k6/latest/set-up/install-k6/"
  exit 1
fi

# ── Build environment args ──────────────────────────────────────────────────
ENV_ARGS="-e SCENARIO=${SCENARIO} -e ENVIRONMENT=${ENVIRONMENT}"

if [[ -n "$BASE_URL" ]]; then
  ENV_ARGS="${ENV_ARGS} -e BASE_URL=${BASE_URL}"
fi

# ── Create results directory if exporting ────────────────────────────────────
if [[ "$EXPORT" == true ]]; then
  mkdir -p "$RESULTS_DIR"
fi

# ── Header ───────────────────────────────────────────────────────────────────
echo "============================================================================"
echo "  k6 Load Tests"
echo "============================================================================"
echo "  Cenário:    ${SCENARIO}"
echo "  Teste(s):   ${TEST}"
echo "  Ambiente:   ${ENVIRONMENT}"
if [[ -n "$BASE_URL" ]]; then
  echo "  Base URL:   ${BASE_URL}"
fi
echo "  Exportar:   ${EXPORT}"
echo "============================================================================"
echo ""

# ── Run function ─────────────────────────────────────────────────────────────
run_test() {
  local test_file="$1"
  local test_name="$2"
  local exit_code=0

  echo "──────────────────────────────────────────────────────────────────────────"
  echo "  Executando: ${test_name} (${SCENARIO})"
  echo "──────────────────────────────────────────────────────────────────────────"

  local cmd="k6 run ${ENV_ARGS} ${test_file}"

  if [[ "$EXPORT" == true ]]; then
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local report_file="${RESULTS_DIR}/${test_name}_${SCENARIO}_${timestamp}.json"
    cmd="${cmd} --summary-export=${report_file}"
    echo "  Relatório: ${report_file}"
  fi

  echo ""

  eval "$cmd" || exit_code=$?

  echo ""

  if [[ $exit_code -ne 0 ]]; then
    echo "  FALHOU: ${test_name} (exit code: ${exit_code})"
    echo ""
    return $exit_code
  else
    echo "  PASSOU: ${test_name}"
    echo ""
  fi

  return 0
}

# ── Execute tests ────────────────────────────────────────────────────────────
FAILED=0

if [[ "$TEST" == "auth" || "$TEST" == "all" ]]; then
  run_test "${TESTS_DIR}/auth.load.test.js" "auth" || FAILED=$((FAILED + 1))
fi

if [[ "$TEST" == "users" || "$TEST" == "all" ]]; then
  run_test "${TESTS_DIR}/users.load.test.js" "users" || FAILED=$((FAILED + 1))
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo "============================================================================"
if [[ $FAILED -gt 0 ]]; then
  echo "  RESULTADO: ${FAILED} teste(s) falharam"
  echo "============================================================================"
  exit 1
else
  echo "  RESULTADO: Todos os testes passaram"
  echo "============================================================================"
  exit 0
fi
