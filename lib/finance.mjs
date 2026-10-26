// Lógica financeira PURA (sem fs). Usada no servidor, no cliente e nos scripts.
// Modelo: itens (receitas/despesas) geram "ocorrências" por mês, em duas formas:
//   - recorrência: { startMonth:'YYYY-MM', day, amount, installments:null|n }
//   - agenda explícita: schedule:[{ month:'YYYY-MM', day, amount }]
// Status de pago e valores editados vivem em plan.paid e plan.overrides,
// ambos indexados pela chave da ocorrência: "<itemId>@<YYYY-MM>".

export const CATEGORIES = { fixo: "Fixos", variavel: "Variáveis", divida: "Dívidas" };
export const MARGIN_WARN = 100; // abaixo disso (e >= 0) o app avisa "margem apertada"

/* ---------- utilidades ---------- */
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const brl = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0);

const pad = (n) => String(n).padStart(2, "0");
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function parseMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  return { y, m };
}
export function monthIndex(ym) {
  const { y, m } = parseMonth(ym);
  return y * 12 + (m - 1);
}
export function addMonths(ym, n) {
  const t = monthIndex(ym) + n;
  return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`;
}
export function monthList(start, count) {
  return Array.from({ length: count }, (_, i) => addMonths(start, i));
}
export function daysInMonth(ym) {
  const { y, m } = parseMonth(ym);
  return new Date(y, m, 0).getDate();
}
export function clampDay(ym, day) {
  return Math.min(Math.max(1, Number(day) || 1), daysInMonth(ym));
}
export function monthLabel(ym) {
  const { y, m } = parseMonth(ym);
  return `${MESES[m - 1]}/${y}`;
}
export function fmtDate(ym, day) {
  return `${pad(day)}/${ym.slice(5, 7)}`;
}
export function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
export function thirteenthYears(startMonth, count) {
  const a = parseMonth(startMonth).y;
  const b = parseMonth(addMonths(startMonth, count - 1)).y;
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

/* ---------- 13º salário ---------- */
// 1ª parcela (até 30/11): 50% do bruto, sem descontos.
// 2ª parcela (até 20/12): líquido estimado − 1ª parcela (já com INSS/IR).
// É uma ESTIMATIVA: ajuste os valores (clique no valor) conforme o seu holerite.
export function thirteenthEntries(plan, years) {
  const gross = plan.salary?.gross ?? 0;
  const net = plan.salary?.net ?? 0;
  const first = round2(gross / 2);
  const second = round2(Math.max(net - first, 0));
  return [
    {
      id: "inc-13-1",
      description: "13º Salário — 1ª parcela",
      note: "Estimativa: 50% do bruto, pago até 30/11",
      schedule: years.map((y) => ({ month: `${y}-11`, day: 30, amount: first })),
    },
    {
      id: "inc-13-2",
      description: "13º Salário — 2ª parcela",
      note: "Estimativa: líquido − 1ª parcela, pago até 20/12",
      schedule: years.map((y) => ({ month: `${y}-12`, day: 20, amount: second })),
    },
  ];
}

export function regenerate13th(plan) {
  const years = thirteenthYears(plan.startMonth, plan.monthsCount);
  const rest = plan.incomes.filter((i) => !i.id.startsWith("inc-13-"));
  return { ...plan, incomes: [...rest, ...thirteenthEntries(plan, years)] };
}

/* ---------- ocorrências ---------- */
export function occurrencesOf(item, ym, overrides = {}) {
  const out = [];
  const make = (base, day, extra = {}) => {
    const key = out.length === 0 ? `${item.id}@${ym}` : `${item.id}@${ym}#${out.length}`;
    const has = overrides[key] !== undefined;
    out.push({
      key,
      itemId: item.id,
      month: ym,
      day: clampDay(ym, day),
      amount: round2(has ? overrides[key] : base),
      baseAmount: round2(base),
      overridden: has,
      ...extra,
    });
  };
  if (Array.isArray(item.schedule)) {
    item.schedule.forEach((s, i) => {
      if (s.month === ym) {
        make(s.amount, s.day ?? item.day ?? 1, {
          installment: item.schedule.length > 1 ? i + 1 : null,
          installments: item.schedule.length > 1 ? item.schedule.length : null,
        });
      }
    });
  }
  if (item.startMonth) {
    const idx = monthIndex(ym) - monthIndex(item.startMonth);
    if (idx >= 0 && (item.installments == null || idx < item.installments)) {
      make(item.amount, item.day, {
        installment: item.installments ? idx + 1 : null,
        installments: item.installments ?? null,
        recurring: true,
      });
    }
  }
  return out;
}

export function monthData(plan, ym) {
  const overrides = plan.overrides || {};
  const paidMap = plan.paid || {};
  const byDay = (a, b) => a.day - b.day || a.description.localeCompare(b.description);
  const incomes = (plan.incomes || [])
    .flatMap((i) =>
      occurrencesOf(i, ym, overrides).map((o) => ({ ...o, description: i.description, note: i.note }))
    )
    .sort(byDay);
  const expenses = (plan.expenses || [])
    .flatMap((e) =>
      occurrencesOf(e, ym, overrides).map((o) => ({
        ...o,
        description: e.description,
        category: e.category,
        note: e.note,
        editable: !!e.editable,
        paid: !!paidMap[o.key],
      }))
    )
    .sort(byDay);
  return { incomes, expenses };
}

const sum = (arr) => round2(arr.reduce((s, x) => s + x.amount, 0));

/* ---------- resumo do mês ---------- */
// Sobra = Entradas − Saídas. Reserva = 50% da sobra + aportes − resgates.
// Caixa = 50% da sobra − aportes + resgates.
export function summarize(plan, ym) {
  const { incomes, expenses } = monthData(plan, ym);
  const entradas = sum(incomes);
  const saidas = sum(expenses);
  const pagas = sum(expenses.filter((e) => e.paid));
  const sobra = round2(entradas - saidas);
  const baseReserva = sobra > 0 ? round2(sobra * 0.5) : 0;
  const baseCaixa = round2(sobra - baseReserva);

  // Movimentações entre caixa e reserva (exclusivamente com a reserva principal)
  const allTransfers = plan.transfers || [];
  const transfersInMonth = allTransfers.filter((t) => t.month === ym);
  const isReserve = (x) => x === "reserva" || x === "principal";
  const transferredToReserve = sum(transfersInMonth.filter((t) => t.from === "caixa" && isReserve(t.to)));
  const transferredToCash = sum(transfersInMonth.filter((t) => isReserve(t.from) && t.to === "caixa"));
  const netToReserve = round2(transferredToReserve - transferredToCash);

  const reserva = round2(baseReserva + netToReserve);
  const caixa = round2(baseCaixa - netToReserve);

  const porCategoria = Object.fromEntries(
    Object.keys(CATEGORIES).map((c) => [c, sum(expenses.filter((e) => e.category === c))])
  );
  return {
    entradas,
    saidas,
    pagas,
    aPagar: round2(saidas - pagas),
    sobra,
    baseReserva,
    baseCaixa,
    transferredToReserve,
    transferredToCash,
    netToReserve,
    transfers: transfersInMonth,
    reserva,
    caixa,
    porCategoria,
  };
}

/* ---------- fluxo de caixa dia a dia ---------- */
export function openingFor(plan, ym) {
  const start = plan.startMonth;
  const initial = Number(plan.openingBalance) || 0;
  if (monthIndex(ym) <= monthIndex(start)) return initial;
  if (plan.accumulate === false) return 0;
  let bal = initial;
  for (let m = start; monthIndex(m) < monthIndex(ym); m = addMonths(m, 1)) {
    const s = summarize(plan, m);
    bal += (s.entradas - s.saidas) + (s.transferredToCash - s.transferredToReserve);
  }
  return round2(bal);
}

// Simula o saldo em conta dia a dia. No mesmo dia, as entradas são aplicadas
// antes das saídas (ex.: salário e boleto no dia 30).
export function simulateCashflow(plan, ym) {
  const opening = openingFor(plan, ym);
  const { incomes, expenses } = monthData(plan, ym);

  // Eventos de transferência do mês que afetam o caixa da conta corrente
  const monthTransfers = (plan.transfers || []).filter(
    (t) => t.month === ym && (t.from === "caixa" || t.to === "caixa")
  );
  const transferEvents = monthTransfers.map((t) => ({
    key: t.id,
    day: clampDay(ym, t.day || 1),
    type: t.to === "caixa" ? "in" : "out",
    amount: t.amount,
    description:
      t.to === "caixa"
        ? `Resgate da Reserva${t.note ? `: ${t.note}` : ""}`
        : `Aporte na Reserva${t.note ? `: ${t.note}` : ""}`,
    isTransfer: true,
  }));

  const events = [
    ...incomes.map((i) => ({ ...i, type: "in" })),
    ...expenses.map((e) => ({ ...e, type: "out" })),
    ...transferEvents,
  ].sort((a, b) => a.day - b.day || (a.type === b.type ? 0 : a.type === "in" ? -1 : 1));

  let balance = opening;
  let lowest = { balance: opening, day: 1 };
  const alerts = [];
  const balanceAfter = {};
  const days = [];

  if (opening < -0.005) {
    alerts.push({
      level: "danger",
      day: 1,
      message: `O mês já começa com saldo negativo de ${brl(opening)} (herdado dos meses anteriores).`,
    });
  }

  for (let d = 1; d <= daysInMonth(ym); d++) {
    const dayEvents = events.filter((e) => e.day === d);
    for (const e of dayEvents) {
      balance = round2(balance + (e.type === "in" ? e.amount : -e.amount));
      balanceAfter[e.key] = balance;
      if (balance < lowest.balance) lowest = { balance, day: d };
      if (e.type !== "out") continue;
      if (balance < -0.005) {
        const next = incomes.find((i) => i.day > d);
        alerts.push({
          level: "danger",
          day: d,
          key: e.key,
          message:
            `Dia ${pad(d)}: saldo insuficiente para pagar "${e.description}" (${brl(e.amount)}). ` +
            `Faltam ${brl(-balance)}. ` +
            (next
              ? `A próxima entrada só ocorre no dia ${pad(next.day)} (${brl(next.amount)}).`
              : "Não há novas entradas previstas neste mês."),
        });
      } else if (balance < MARGIN_WARN) {
        alerts.push({
          level: "warn",
          day: d,
          key: e.key,
          message: `Dia ${pad(d)}: margem apertada após pagar "${e.description}" — sobram só ${brl(balance)}.`,
        });
      }
    }
    days.push({ day: d, events: dayEvents, closing: balance });
  }

  return {
    opening,
    closing: balance,
    days,
    alerts,
    balanceAfter,
    lowest,
    ok: !alerts.some((a) => a.level === "danger"),
  };
}

/* ---------- mutações imutáveis do plano ---------- */
const splitDate = (date) => ({ month: date.slice(0, 7), day: Number(date.slice(8, 10)) });

export function findItem(plan, id) {
  return plan.incomes.find((i) => i.id === id) || plan.expenses.find((e) => e.id === id);
}

export function renamePlan(plan, { name, focus }) {
  return {
    ...plan,
    ...(name !== undefined ? { name: name.trim() || plan.name } : {}),
    ...(focus !== undefined ? { focus: focus.trim() } : {}),
  };
}

export function addVariableExpense(plan, { description, amount, date, paid }) {
  const { month, day } = splitDate(date);
  const id = newId("var");
  const item = {
    id,
    description,
    category: "variavel",
    custom: true,
    schedule: [{ month, day, amount: round2(amount) }],
  };
  return {
    ...plan,
    expenses: [...plan.expenses, item],
    paid: paid ? { ...(plan.paid || {}), [`${id}@${month}`]: true } : plan.paid || {},
  };
}

export function addIncomeEntry(plan, { description, amount, date }) {
  const { month, day } = splitDate(date);
  const item = {
    id: newId("inc"),
    description,
    custom: true,
    schedule: [{ month, day, amount: round2(amount) }],
  };
  return { ...plan, incomes: [...plan.incomes, item] };
}

export function removeItem(plan, id, ym) {
  const mapList = (list) => {
    return (list || [])
      .map((item) => {
        if (item.id !== id) return item;
        if (ym && Array.isArray(item.schedule) && item.schedule.length > 1) {
          return {
            ...item,
            schedule: item.schedule.filter((s) => s.month !== ym),
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const incomes = mapList(plan.incomes);
  const expenses = mapList(plan.expenses);

  const overrides = { ...(plan.overrides || {}) };
  const paid = { ...(plan.paid || {}) };

  if (ym) {
    delete overrides[`${id}@${ym}`];
    delete paid[`${id}@${ym}`];
  } else {
    for (const k of Object.keys(overrides)) {
      if (k.startsWith(`${id}@`)) delete overrides[k];
    }
    for (const k of Object.keys(paid)) {
      if (k.startsWith(`${id}@`)) delete paid[k];
    }
  }

  return {
    ...plan,
    incomes,
    expenses,
    overrides,
    paid,
  };
}

export function togglePaid(plan, key) {
  const paid = { ...(plan.paid || {}) };
  if (paid[key]) delete paid[key];
  else paid[key] = true;
  return { ...plan, paid };
}

// Edita o valor de uma ocorrência (ex.: juros do financiamento mudaram).
// forward=true aplica o mesmo valor nos meses seguintes do horizonte.
export function applyOverride(plan, occ, amount, forward = false) {
  const overrides = { ...(plan.overrides || {}) };
  const set = (key, base) => {
    if (Math.abs(base - amount) < 0.005) delete overrides[key];
    else overrides[key] = round2(amount);
  };
  set(occ.key, occ.baseAmount);
  if (forward) {
    const item = findItem(plan, occ.itemId);
    if (item) {
      for (const m of monthList(plan.startMonth, plan.monthsCount)) {
        if (monthIndex(m) <= monthIndex(occ.month)) continue;
        occurrencesOf(item, m, {}).forEach((o) => set(o.key, o.baseAmount));
      }
    }
  }
  return { ...plan, overrides };
}

/* ---------- adição flexível de lançamentos ---------- */
export function addCustomExpense(
  plan,
  { description, category = "variavel", amount, day, date, recurrence = "once", installments = 1, paid = false, note = "" }
) {
  const d = date ? splitDate(date) : { month: plan.startMonth, day: clampDay(plan.startMonth, day || 1) };
  const targetDay = clampDay(d.month, day || d.day || 1);
  const id = newId(category.slice(0, 3));
  const parsedAmount = round2(amount);

  let item;
  if (recurrence === "monthly") {
    item = {
      id,
      description,
      category,
      amount: parsedAmount,
      day: targetDay,
      startMonth: d.month,
      installments: null,
      custom: true,
      note: note.trim() || undefined,
    };
  } else if (recurrence === "installments") {
    item = {
      id,
      description,
      category,
      amount: parsedAmount,
      day: targetDay,
      startMonth: d.month,
      installments: Math.max(1, Number(installments) || 1),
      custom: true,
      note: note.trim() || undefined,
    };
  } else {
    // "once" (avulso no mês específico)
    item = {
      id,
      description,
      category,
      custom: true,
      note: note.trim() || undefined,
      schedule: [{ month: d.month, day: targetDay, amount: parsedAmount }],
    };
  }

  const updatedPaid = paid ? { ...(plan.paid || {}), [`${id}@${d.month}`]: true } : plan.paid || {};
  return {
    ...plan,
    expenses: [...plan.expenses, item],
    paid: updatedPaid,
  };
}

export function addCustomIncome(
  plan,
  { description, amount, day, date, recurrence = "once", note = "" }
) {
  const d = date ? splitDate(date) : { month: plan.startMonth, day: clampDay(plan.startMonth, day || 1) };
  const targetDay = clampDay(d.month, day || d.day || 1);
  const id = newId("inc");
  const parsedAmount = round2(amount);

  let item;
  if (recurrence === "monthly") {
    item = {
      id,
      description,
      amount: parsedAmount,
      day: targetDay,
      startMonth: d.month,
      installments: null,
      custom: true,
      note: note.trim() || undefined,
    };
  } else {
    item = {
      id,
      description,
      custom: true,
      note: note.trim() || undefined,
      schedule: [{ month: d.month, day: targetDay, amount: parsedAmount }],
    };
  }

  return { ...plan, incomes: [...plan.incomes, item] };
}

export function updateItem(plan, id, changes) {
  const mapList = (list) =>
    list.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, ...changes };
      if (changes.day !== undefined && Array.isArray(updated.schedule)) {
        updated.schedule = updated.schedule.map((s) => ({ ...s, day: changes.day }));
      }
      return updated;
    });
  return {
    ...plan,
    incomes: mapList(plan.incomes),
    expenses: mapList(plan.expenses),
  };
}


// Marca como pagas todas as contas de um mês cujo dia de vencimento seja <= targetDay
export function markAllOverduePaid(plan, ym, targetDay) {
  const { expenses } = monthData(plan, ym);
  const paid = { ...(plan.paid || {}) };
  let count = 0;
  expenses.forEach((e) => {
    if (e.day <= targetDay && !e.paid) {
      paid[e.key] = true;
      count++;
    }
  });
  return { updatedPlan: { ...plan, paid }, count };
}

/* ---------- métricas e comparativo de planos ---------- */
export function calculatePlanMetrics(plan) {
  if (!plan) return null;
  const months = monthList(plan.startMonth, plan.monthsCount);
  let totalIncomes = 0;
  let totalExpenses = 0;
  let totalSurplus = 0;
  let totalReserve = 0;
  let totalFreeCash = 0;
  let dangerMonthCount = 0;
  let totalFixed = 0;
  let totalVariable = 0;
  let totalDebts = 0;

  months.forEach((m) => {
    const s = summarize(plan, m);
    const sim = simulateCashflow(plan, m);
    totalIncomes += s.entradas;
    totalExpenses += s.saidas;
    totalSurplus += s.sobra;
    totalReserve += s.reserva;
    totalFreeCash += s.caixa;
    totalFixed += s.porCategoria.fixo || 0;
    totalVariable += s.porCategoria.variavel || 0;
    totalDebts += s.porCategoria.divida || 0;
    if (sim.alerts.some((a) => a.level === "danger")) {
      dangerMonthCount++;
    }
  });

  const lastMonth = months[months.length - 1];
  const lastSim = simulateCashflow(plan, lastMonth);

  return {
    id: plan.id,
    name: plan.name,
    focus: plan.focus,
    monthsCount: months.length,
    totalIncomes: round2(totalIncomes),
    totalExpenses: round2(totalExpenses),
    totalSurplus: round2(totalSurplus),
    totalReserve: round2(totalReserve),
    totalFreeCash: round2(totalFreeCash),
    avgMonthlySurplus: round2(totalSurplus / months.length),
    finalClosing: round2(lastSim.closing),
    dangerMonthCount,
    totalFixed: round2(totalFixed),
    totalVariable: round2(totalVariable),
    totalDebts: round2(totalDebts),
  };
}

/* ---------- progresso da reserva de emergência ---------- */
export function calculateReserveProgress(plan, currentMonth) {
  if (!plan || !currentMonth) return { accumulatedReserve: 0, monthlyFixed: 0, target6Months: 0, progressPct: 0, monthsCovered: 0 };
  const months = monthList(plan.startMonth, plan.monthsCount);
  let accumulatedReserve = 0;
  for (const m of months) {
    if (monthIndex(m) > monthIndex(currentMonth)) break;
    const s = summarize(plan, m);
    accumulatedReserve += s.reserva;
  }
  const currentSummary = summarize(plan, currentMonth);
  const monthlyFixed = currentSummary.porCategoria.fixo || 1;
  const target6Months = round2(monthlyFixed * 6);
  const progressPct = target6Months > 0 ? Math.min(Math.round((accumulatedReserve / target6Months) * 100), 100) : 100;
  const monthsCovered = monthlyFixed > 0 ? round2(accumulatedReserve / monthlyFixed) : 0;

  return {
    accumulatedReserve: round2(accumulatedReserve),
    monthlyFixed: round2(monthlyFixed),
    target6Months,
    progressPct,
    monthsCovered,
  };
}

/* ---------- fechamento de mês ---------- */
/**
 * Registra o fechamento do mês: todas as despesas foram pagas.
 * Armazena o caixa livre no momento do fechamento para exibição.
 * OBS: o carry-forward para o mês seguinte já acontece automaticamente
 * via openingFor (acumula entradas - saídas). Este registro é auditável.
 */
export function closeMonth(plan, ym) {
  const s = summarize(plan, ym);
  const record = {
    month: ym,
    caixaLivre: s.caixa,
    sobra: s.sobra,
    closedAt: new Date().toISOString(),
  };
  const existing = (plan.closedMonths || []).filter((c) => c.month !== ym);
  return { ...plan, closedMonths: [...existing, record] };
}

export function reopenMonth(plan, ym) {
  return {
    ...plan,
    closedMonths: (plan.closedMonths || []).filter((c) => c.month !== ym),
  };
}

export function isMonthClosed(plan, ym) {
  return (plan.closedMonths || []).some((c) => c.month === ym);
}

export function getClosedMonthData(plan, ym) {
  return (plan.closedMonths || []).find((c) => c.month === ym) || null;
}

/* ---------- transferências entre caixa e caixinhas da reserva ---------- */
export function addTransfer(plan, { month, day, from, to, amount, note = "" }) {
  const parsedAmount = round2(amount);
  if (!(parsedAmount > 0)) return plan;

  // Normaliza 'reserva' legada para 'principal'
  let normalizedFrom = from === "reserva" ? "principal" : from;
  let normalizedTo = to === "reserva" ? "principal" : to;

  if (normalizedFrom === normalizedTo) return plan;

  // REGRA: Movimentação do Caixa Livre APENAS com a Reserva Principal
  if (normalizedFrom === "caixa" && normalizedTo !== "principal") {
    throw new Error("O Caixa Livre só pode movimentar saldo com a Reserva Principal.");
  }
  if (normalizedTo === "caixa" && normalizedFrom !== "principal") {
    throw new Error("O resgate para o Caixa Livre só pode ser feito a partir da Reserva Principal.");
  }

  const buckets = getPlanBuckets(plan);
  const validIds = ["caixa", ...buckets.map((b) => b.id)];
  if (!validIds.includes(normalizedFrom) || !validIds.includes(normalizedTo)) {
    return plan;
  }

  const targetDay = clampDay(month, day || 1);
  const transfer = {
    id: newId("trf"),
    month,
    day: targetDay,
    from: normalizedFrom,
    to: normalizedTo,
    amount: parsedAmount,
    note: note.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  return {
    ...plan,
    transfers: [...(plan.transfers || []), transfer],
  };
}

export function removeTransfer(plan, id) {
  return {
    ...plan,
    transfers: (plan.transfers || []).filter((t) => t.id !== id),
  };
}

/* ---------- caixinhas de reserva (sub-reservas por plano) ---------- */
export const DEFAULT_BUCKET = {
  id: "principal",
  name: "Reserva Principal",
  icon: "🛡️",
  isDefault: true,
  target: null,
};

export function getPlanBuckets(plan) {
  if (Array.isArray(plan?.reserveBuckets) && plan.reserveBuckets.length > 0) {
    const hasPrincipal = plan.reserveBuckets.some((b) => b.id === "principal");
    if (!hasPrincipal) {
      return [DEFAULT_BUCKET, ...plan.reserveBuckets];
    }
    return plan.reserveBuckets;
  }
  return [DEFAULT_BUCKET];
}

export function addReserveBucket(plan, { name, icon, target }) {
  const trimmed = name?.trim();
  if (!trimmed) return plan;
  const buckets = getPlanBuckets(plan);
  const id = newId("bkt");
  const parsedTarget =
    target !== undefined && target !== null && target !== ""
      ? Math.max(0, parseFloat(String(target).replace(",", ".")) || 0)
      : null;

  const newBucket = {
    id,
    name: trimmed,
    icon: icon?.trim() || "🎯",
    target: parsedTarget,
    isDefault: false,
    createdAt: new Date().toISOString(),
  };

  return {
    ...plan,
    reserveBuckets: [...buckets, newBucket],
  };
}

export function updateReserveBucket(plan, id, changes) {
  const buckets = getPlanBuckets(plan);
  const updated = buckets.map((b) => {
    if (b.id !== id) return b;
    const res = { ...b };
    if (changes.name && changes.name.trim()) res.name = changes.name.trim();
    if (changes.icon && changes.icon.trim()) res.icon = changes.icon.trim();
    if (changes.target !== undefined) {
      res.target =
        changes.target === null || changes.target === ""
          ? null
          : Math.max(0, parseFloat(String(changes.target).replace(",", ".")) || 0);
    }
    return res;
  });

  return {
    ...plan,
    reserveBuckets: updated,
  };
}

export function deleteReserveBucket(plan, id) {
  if (id === "principal") return plan; // Não pode excluir o Hub Central
  const buckets = getPlanBuckets(plan).filter((b) => b.id !== id);

  // Redireciona transferências órfãs para a Reserva Principal
  const transfers = (plan.transfers || [])
    .map((t) => {
      let from = t.from === id ? "principal" : t.from;
      let to = t.to === id ? "principal" : t.to;
      return { ...t, from, to };
    })
    .filter((t) => t.from !== t.to);

  return {
    ...plan,
    reserveBuckets: buckets,
    transfers,
  };
}

/**
 * Calcula os saldos acumulados de cada caixinha até o mês indicado.
 * - Reserva Principal: recebe 50% da sobra automática de todos os meses + transferências recebidas - enviadas.
 * - Outras Caixinhas: transferências recebidas - transferências enviadas.
 */
export function calculateBucketBalances(plan, upToMonth) {
  if (!plan) return [];
  const buckets = getPlanBuckets(plan);
  const months = monthList(plan.startMonth, plan.monthsCount);
  const targetIdx = upToMonth ? monthIndex(upToMonth) : Infinity;

  // 1. Acumula baseReserva (50% da sobra) gerada até upToMonth
  let totalBaseReserva = 0;
  for (const m of months) {
    if (monthIndex(m) > targetIdx) break;
    const s = summarize(plan, m);
    totalBaseReserva += s.baseReserva;
  }

  // 2. Transações realizadas até upToMonth
  const transfers = (plan.transfers || []).filter((t) => monthIndex(t.month) <= targetIdx);

  return buckets.map((b) => {
    let balance = b.id === "principal" ? totalBaseReserva : 0;

    for (const t of transfers) {
      const from = t.from === "reserva" ? "principal" : t.from;
      const to = t.to === "reserva" ? "principal" : t.to;

      if (to === b.id) balance += t.amount;
      if (from === b.id) balance -= t.amount;
    }

    const rounded = round2(balance);
    const target = b.target || null;
    const progressPct = target && target > 0 ? Math.min(Math.round((rounded / target) * 100), 100) : null;

    return {
      ...b,
      balance: rounded,
      progressPct,
    };
  });
}

/* ---------- edição de salário por plano ---------- */
export function updatePlanSalary(plan, { gross, net, recalculate13th = true }) {
  const parsedGross = Math.max(0, parseFloat(String(gross).replace(",", ".")) || 0);
  const parsedNet = Math.max(0, parseFloat(String(net).replace(",", ".")) || 0);

  let updated = {
    ...plan,
    salary: { gross: parsedGross, net: parsedNet },
  };

  if (recalculate13th) {
    updated = regenerate13th(updated);
  }

  return updated;
}
