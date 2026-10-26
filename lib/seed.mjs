// Dados iniciais (seed) limpos para novos planos.
import { thirteenthEntries, thirteenthYears } from "./finance.mjs";

export const START_MONTH = "2026-11";
export const MONTHS_COUNT = 14; // nov/2026 → dez/2027
export const SALARY = { gross: 0, net: 0 };

const inc = (id, description, amount, day, extra = {}) => ({
  id, description, amount, day, startMonth: START_MONTH, installments: null, ...extra,
});
const exp = (id, description, category, amount, day, extra = {}) => ({
  id, description, category, amount, day, startMonth: START_MONTH, installments: null, ...extra,
});
const sched = (id, description, category, schedule, extra = {}) => ({
  id, description, category, schedule, ...extra,
});

// Receitas comuns a todos os planos (vazio por padrão)
function baseIncomes() {
  return [];
}

// Dívidas comuns a todos os planos (vazio por padrão)
function baseDebts() {
  return [];
}

const PLAN_DEFS = {
  planA: {
    name: "Plano A",
    focus: "Foco Apartamento",
    expenses: () => [],
  },
  planB: {
    name: "Plano B",
    focus: "Foco Carro",
    expenses: () => [],
  },
  planC: {
    name: "Plano C",
    focus: "Foco Básico",
    expenses: () => [],
  },
};

export const SEED_IDS = Object.keys(PLAN_DEFS);

// Plano base
export function buildBasePlan({ id, name, focus, salary, clean = true }) {
  return {
    id,
    name,
    focus: focus || "Personalizado",
    salary: salary || SALARY,
    openingBalance: 0,
    accumulate: true,
    startMonth: START_MONTH,
    monthsCount: MONTHS_COUNT,
    incomes: clean ? [] : baseIncomes(),
    expenses: clean ? [] : baseDebts(),
    reserveBuckets: [
      { id: "principal", name: "Reserva Principal", icon: "🛡️", isDefault: true, target: null }
    ],
    transfers: [],
    closedMonths: [],
    paid: {},
    overrides: {},
  };
}

export function buildSeedPlan(id) {
  const def = PLAN_DEFS[id];
  const plan = buildBasePlan({ id, name: def.name, focus: def.focus, clean: true });
  plan.expenses.push(...def.expenses());
  return plan;
}
