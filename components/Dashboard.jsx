"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addCustomExpense,
  addCustomIncome,
  addReserveBucket,
  addTransfer,
  applyOverride,
  brl,
  calculateReserveProgress,
  closeMonth,
  deleteReserveBucket,
  getClosedMonthData,
  isMonthClosed,
  markAllOverduePaid,
  monthData,
  monthLabel,
  monthList,
  regenerate13th,
  removeItem,
  removeTransfer,
  renamePlan,
  reopenMonth,
  simulateCashflow,
  summarize,
  togglePaid,
  updateItem,
  updatePlanSalary,
  updateReserveBucket,
} from "@/lib/finance.mjs";
import PlanTabs from "./PlanTabs";
import CashSummary from "./CashSummary";
import ReserveBuckets from "./ReserveBuckets";
import CashflowTimeline from "./CashflowTimeline";
import IncomeList from "./IncomeList";
import ExpenseList from "./ExpenseList";
import YearOverview from "./YearOverview";
import PlanComparisonModal from "./PlanComparisonModal";
import TransferModal from "./TransferModal";
import EditSalaryModal from "./EditSalaryModal";

async function api(url, opts) {
  const r = await fetch(url, { headers: { "Content-Type": "application/json" }, cache: "no-store", ...opts });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || `Erro ${r.status}`);
  return body;
}

export default function Dashboard() {
  const [plans, setPlans] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [month, setMonth] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error
  const [error, setError] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [toast, setToast] = useState(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferModalConfig, setTransferModalConfig] = useState({});
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [allPlansData, setAllPlansData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const planRef = useRef(null);
  const timer = useRef(null);
  const dirty = useRef(false);
  const fileInputRef = useRef(null);

  /* ---- inicialização do tema dark ---- */
  useEffect(() => {
    const isDarkNow = document.documentElement.classList.contains("dark");
    setIsDark(isDarkNow);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  /* ---- usuário autenticado e logout ---- */
  useEffect(() => {
    api("/api/auth/me")
      .then((d) => setCurrentUser(d.user))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  /* ---- persistência (debounce + flush ao trocar de plano) ---- */
  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current || !planRef.current) return;
    dirty.current = false;
    const snapshot = planRef.current;
    setStatus("saving");
    try {
      await api(`/api/plans/${snapshot.id}`, { method: "PUT", body: JSON.stringify(snapshot) });
      if (!dirty.current) setStatus("saved");
    } catch (e) {
      dirty.current = true;
      setStatus("error");
      setError(e.message);
    }
  }, []);

  const commit = useCallback(
    (next) => {
      planRef.current = next;
      setPlan(next);
      dirty.current = true;
      setStatus("saving");
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 350);
    },
    [flush]
  );

  /* ---- carga inicial ---- */
  useEffect(() => {
    api("/api/plans")
      .then((d) => {
        setPlans(d.plans);
        if (d.plans.length) setActiveId(d.plans[0].id);
      })
      .catch((e) => {
        if (e.message.includes("401") || e.message.includes("autorizado")) {
          window.location.href = "/login";
          return;
        }
        setStatus("error");
        setError(e.message);
      });
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    api(`/api/plans/${activeId}`)
      .then(({ plan: p }) => {
        if (cancelled) return;
        planRef.current = p;
        dirty.current = false;
        setPlan(p);
        setStatus("idle");
        const list = monthList(p.startMonth, p.monthsCount);
        setMonth((cur) => {
          if (cur && list.includes(cur)) return cur;
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          return list.includes(today) ? today : list[0];
        });
      })
      .catch((e) => {
        setStatus("error");
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  useEffect(() => {
    const warn = (e) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  /* ---- ações de planos ---- */
  const selectPlan = async (id) => {
    if (id === activeId) return;
    await flush();
    setPlan(null);
    setActiveId(id);
  };

  const createPlan = async ({ name, copyFrom, gross, net }) => {
    await flush();
    try {
      const d = await api("/api/plans", {
        method: "POST",
        body: JSON.stringify({ name, copyFrom, gross, net }),
      });
      setPlans(d.plans);
      setPlan(null);
      setActiveId(d.plan.id);
      showToast(`Plano "${d.plan.name}" criado com sucesso!`);
    } catch (e) {
      setStatus("error");
      setError(e.message);
    }
  };

  const deletePlan = async (id) => {
    clearTimeout(timer.current);
    if (id === activeId) {
      dirty.current = false;
      planRef.current = null;
    }
    try {
      const d = await api(`/api/plans/${id}`, { method: "DELETE" });
      setPlans(d.plans);
      if (id === activeId) {
        setPlan(null);
        setActiveId(d.plans[0]?.id ?? null);
      }
      showToast("Plano excluído com sucesso.");
    } catch (e) {
      setStatus("error");
      setError(e.message);
    }
  };

  const renamePlanHandler = async (id, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (plan && plan.id === id) {
      commit(renamePlan(plan, { name: trimmed }));
    } else {
      try {
        const { plan: target } = await api(`/api/plans/${id}`);
        const updated = renamePlan(target, { name: trimmed });
        await api(`/api/plans/${id}`, { method: "PUT", body: JSON.stringify(updated) });
      } catch (e) {
        console.error(e);
      }
    }
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p)));
    showToast(`Plano renomeado para "${trimmed}"!`);
  };

  const handleEditItem = (id, changes) => {
    if (!plan) return;
    commit(updateItem(plan, id, changes));
    showToast("Lançamento atualizado com sucesso!");
  };

  const handleRemoveItem = (id, ym) => {
    if (!plan) return;
    commit(removeItem(plan, id, ym));
    showToast("Lançamento excluído com sucesso!");
  };

  /* ---- comparativo de planos ---- */
  const openComparison = async () => {
    try {
      const fullPlans = await Promise.all(
        plans.map(async (p) => {
          const res = await api(`/api/plans/${p.id}`);
          return res.plan;
        })
      );
      setAllPlansData(fullPlans);
      setComparisonOpen(true);
    } catch (e) {
      showToast(`Erro ao carregar planos para comparação: ${e.message}`);
    }
  };

  /* ---- exportação e importação ---- */
  const exportJSON = () => {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Backup de ${plan.name} exportado em JSON!`);
  };

  const exportCSV = () => {
    if (!plan) return;
    const months = monthList(plan.startMonth, plan.monthsCount);
    let csv = "Mês;Dia;Tipo;Categoria;Descrição;Valor (R$);Pago;Nota\n";

    months.forEach((m) => {
      const { incomes, expenses } = monthData(plan, m);
      incomes.forEach((i) => {
        csv += `${m};${i.day};Entrada;Receita;${i.description.replace(/;/g, ",")};${i.amount.toFixed(2)};Sim;${(i.note || "").replace(/;/g, ",")}\n`;
      });
      expenses.forEach((e) => {
        csv += `${m};${e.day};Saída;${e.category};${e.description.replace(/;/g, ",")};${e.amount.toFixed(2)};${e.paid ? "Sim" : "Não"};${(e.note || "").replace(/;/g, ",")}\n`;
      });
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.id}_extrato_completo.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Extrato em planilha CSV exportado com sucesso!`);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!imported.incomes || !imported.expenses) {
        throw new Error("Arquivo JSON inválido (faltam incomes ou expenses).");
      }
      // Se plano tem id protegido ou repetido, criar um novo
      const d = await api("/api/plans", {
        method: "POST",
        body: JSON.stringify({ name: `${imported.name || "Plano"} (Importado)` }),
      });
      // Sobrescrever o conteúdo do plano criado com o importado
      const targetPlan = { ...imported, id: d.plan.id, name: d.plan.name };
      await api(`/api/plans/${d.plan.id}`, { method: "PUT", body: JSON.stringify(targetPlan) });
      setPlans(d.plans);
      setActiveId(d.plan.id);
      showToast(`Plano "${d.plan.name}" importado e ativado com sucesso!`);
    } catch (err) {
      showToast(`Falha ao importar plano: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ---- marcar vencidas como pagas ---- */
  const handlePayOverdue = () => {
    if (!plan || !month) return;
    const now = new Date();
    const today = now.getDate();
    const { updatedPlan, count } = markAllOverduePaid(plan, month, today);
    if (count > 0) {
      commit(updatedPlan);
      showToast(`⚡ ${count} conta(s) vencida(s) até hoje foram marcadas como pagas!`);
    } else {
      showToast("Não há contas pendentes com vencimento até hoje neste mês.");
    }
  };

  /* ---- movimentações entre caixa e caixinhas da reserva ---- */
  const handleOpenTransferModal = (config = {}) => {
    setTransferModalConfig(config);
    setTransferModalOpen(true);
  };

  const handleAddTransfer = (params) => {
    try {
      const next = addTransfer(plan, params);
      commit(next);
      showToast("Movimentação registrada com sucesso!");
    } catch (e) {
      showToast(`Atenção: ${e.message}`);
    }
  };

  const handleRemoveTransfer = (transferId) => {
    const next = removeTransfer(plan, transferId);
    commit(next);
    showToast("Movimentação cancelada.");
  };

  /* ---- caixinhas de reserva ---- */
  const handleAddBucket = ({ name, icon, target }) => {
    if (!plan) return;
    commit(addReserveBucket(plan, { name, icon, target }));
    showToast(`Caixinha "${name}" criada com sucesso!`);
  };

  const handleUpdateBucket = (id, changes) => {
    if (!plan) return;
    commit(updateReserveBucket(plan, id, changes));
    showToast("Caixinha atualizada!");
  };

  const handleDeleteBucket = (id) => {
    if (!plan) return;
    commit(deleteReserveBucket(plan, id));
    showToast("Caixinha excluída. Saldo retornado para a Reserva Principal.");
  };

  /* ---- salário por plano ---- */
  const handleUpdateSalary = ({ gross, net, recalculate13th }) => {
    if (!plan) return;
    commit(updatePlanSalary(plan, { gross, net, recalculate13th }));
    showToast("Salário atualizado com sucesso!");
  };

  /* ---- fechamento de mês ---- */
  const handleCloseMonth = () => {
    if (!plan || !month) return;
    const next = closeMonth(plan, month);
    const s = summarize(next, month);
    const nextMth = months[months.indexOf(month) + 1];
    commit(next);
    const carryMsg = s.caixa > 0
      ? `R$ ${s.caixa.toFixed(2).replace(".", ",")} de caixa livre carregado para ${nextMth ? nextMth : "próximo mês"}.`
      : "Mês fechado. Saldo zerado.";
    showToast(`✅ Mês fechado! ${carryMsg}`);
  };

  const handleReopenMonth = () => {
    if (!plan || !month) return;
    commit(reopenMonth(plan, month));
    showToast("Mês reaberto para edição.");
  };

  /* ---- derivados ---- */
  const months = useMemo(() => (plan ? monthList(plan.startMonth, plan.monthsCount) : []), [plan]);
  const data = useMemo(() => (plan && month ? monthData(plan, month) : null), [plan, month]);
  const summary = useMemo(() => (plan && month ? summarize(plan, month) : null), [plan, month]);
  const sim = useMemo(() => (plan && month ? simulateCashflow(plan, month) : null), [plan, month]);
  const reserveMetrics = useMemo(() => (plan && month ? calculateReserveProgress(plan, month) : null), [plan, month]);
  const closedMonthData = useMemo(() => (plan && month ? getClosedMonthData(plan, month) : null), [plan, month]);
  const currentRealMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const monthStatusMap = useMemo(() => {
    if (!plan || !months.length) return {};
    const map = {};
    for (const m of months) {
      const closed = isMonthClosed(plan, m);
      const s = summarize(plan, m);
      const isDeficit = s.sobra < -0.005;
      map[m] = { closed, isDeficit };
    }
    return map;
  }, [plan, months]);
  const isCurrentMonthClosed = Boolean(monthStatusMap[month]?.closed);
  const nextMonth = useMemo(() => {
    if (!months.length || !month) return null;
    const idx = months.indexOf(month);
    return idx >= 0 && idx < months.length - 1 ? months[idx + 1] : null;
  }, [months, month]);

  const statusBadge = {
    idle: null,
    saving: <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">⏳ Salvando…</span>,
    saved: <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">✓ Salvo localmente</span>,
    error: <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">⚠️ {error}</span>,
  }[status];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Toast Flutuante */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border border-indigo-200/80 bg-white/95 px-4 py-3 text-xs font-semibold text-slate-800 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 dark:text-white animate-in slide-in-from-bottom-2">
          <span>🔔</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Modal de Comparação de Cenários */}
      {comparisonOpen && (
        <PlanComparisonModal
          plansData={allPlansData}
          activeId={activeId}
          onSelectPlan={selectPlan}
          onClose={() => setComparisonOpen(false)}
        />
      )}

      {/* Modal de Movimentação Financeira */}
      {transferModalOpen && plan && (
        <TransferModal
          month={month}
          summary={summary}
          plan={plan}
          initialConfig={transferModalConfig}
          onAddTransfer={handleAddTransfer}
          onRemoveTransfer={handleRemoveTransfer}
          onClose={() => setTransferModalOpen(false)}
        />
      )}

      {/* Modal de Edição de Salário */}
      {salaryModalOpen && plan && (
        <EditSalaryModal
          plan={plan}
          onSave={handleUpdateSalary}
          onClose={() => setSalaryModalOpen(false)}
        />
      )}

      {/* Input Oculto de Importação */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        className="hidden"
      />

      {/* Header Superior com Identidade Fintech e Ações */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 font-extrabold text-white shadow-md">
              FP
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Financeiro Pessoal
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Compare cenários (Planos A, B, C…), simule o fluxo diário e preveja sua reserva de emergência.
          </p>
        </div>

        {/* Ações da Barra Superior */}
        <div className="flex flex-wrap items-center gap-2.5">
          {statusBadge}

          {/* Menu Dropdown de Backup & Dados */}
          {plan && (
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
              >
                <span>💾</span>
                <span>Dados & Backup</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>

              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 absolute right-0 top-full mt-1.5 w-44 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 z-30">
                <button
                  type="button"
                  onClick={exportJSON}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <span>📤</span> Exportar JSON
                </button>
                <button
                  type="button"
                  onClick={exportCSV}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <span>📊</span> Exportar Planilha (CSV)
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                >
                  <span>📥</span> Importar JSON
                </button>
              </div>
            </div>
          )}

          {/* Alternador de Tema Dark / Light */}
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Alternar tema escuro/claro"
            title="Alternar modo escuro / claro"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-xs hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* Usuário & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-2.5 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                </span>
                <span className="hidden font-medium sm:inline-block max-w-[120px] truncate" title={currentUser.email}>
                  {currentUser.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sair da conta"
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-xs hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-red-900/50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-all"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Abas dos Planos */}
      <PlanTabs
        plans={plans}
        activeId={activeId}
        onSelect={selectPlan}
        onCreate={createPlan}
        onDelete={deletePlan}
        onRename={renamePlanHandler}
        onOpenComparison={openComparison}
      />

      {!plan || !data ? (
        <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
          {status === "error" ? error : "Carregando plano..."}
        </div>
      ) : (
        <>
          {/* Configurações Globais do Plano Ativo */}
          <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-xs shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center gap-2.5">
              <div>
                <div className="font-semibold text-slate-500 dark:text-slate-400">Salário líquido mensal</div>
                <div className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                  {brl(plan.salary?.net)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    (bruto {brl(plan.salary?.gross)})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSalaryModalOpen(true)}
                title="Editar salário bruto e líquido deste plano"
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 shadow-2xs hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors"
              >
                ✎ Alterar
              </button>
            </div>

            <label>
              <span className="block font-semibold text-slate-500 dark:text-slate-400">
                Saldo em conta no início do plano
              </span>
              <input
                type="number"
                step="0.01"
                defaultValue={plan.openingBalance}
                key={plan.id + "-ob"}
                onBlur={(e) => {
                  const n = parseFloat(e.target.value);
                  commit({ ...plan, openingBalance: Number.isFinite(n) ? n : 0 });
                }}
                className="mt-1 w-32 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={plan.accumulate !== false}
                onChange={(e) => commit({ ...plan, accumulate: e.target.checked })}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              Levar o saldo de um mês para o seguinte
            </label>
          </section>

          {/* Seletor de Mês (Navegação Horizontal em Pílulas) */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1" aria-label="Meses">
            {months.map((m) => {
              const isSelected = m === month;
              const st = monthStatusMap[m];
              const isRealToday = m === currentRealMonth;

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonth(m)}
                  className={`group relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/30"
                      : "border border-slate-200/80 bg-white/90 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{monthLabel(m)}</span>
                  {st?.closed && (
                    <span
                      title="Mês Fechado"
                      className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-emerald-300" : "bg-emerald-500"}`}
                    />
                  )}
                  {st?.isDeficit && !st?.closed && (
                    <span
                      title="Déficit no mês"
                      className={`h-1.5 w-1.5 rounded-full animate-pulse-subtle ${isSelected ? "bg-rose-300" : "bg-rose-500"}`}
                    />
                  )}
                  {isRealToday && (
                    <span
                      className={`rounded px-1 text-[9px] font-extrabold uppercase ${
                        isSelected
                          ? "bg-indigo-700/80 text-indigo-100"
                          : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                      }`}
                    >
                      Atual
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Resumo do Mês & Termômetro de Reserva */}
          <CashSummary
            summary={summary}
            reserveMetrics={reserveMetrics}
            month={month}
            nextMonth={nextMonth}
            isClosed={isCurrentMonthClosed}
            closedData={closedMonthData}
            onPayOverdue={handlePayOverdue}
            onOpenTransferModal={() => handleOpenTransferModal({ mode: "caixa_principal" })}
            onCloseMonth={handleCloseMonth}
            onReopenMonth={handleReopenMonth}
          />

          {/* Caixinhas de Reserva */}
          <ReserveBuckets
            plan={plan}
            month={month}
            onAddBucket={handleAddBucket}
            onUpdateBucket={handleUpdateBucket}
            onDeleteBucket={handleDeleteBucket}
            onOpenTransfer={handleOpenTransferModal}
          />

          {/* Gráfico Interativo de Fluxo de Caixa */}
          <CashflowTimeline sim={sim} month={month} />

          {/* Colunas: Entradas à Esquerda, Saídas à Direita */}
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <IncomeList
                month={month}
                incomes={data.incomes}
                onEditAmount={(occ, amount, fwd) => commit(applyOverride(plan, occ, amount, fwd))}
                onEditItem={handleEditItem}
                onAddIncome={(entry) => commit(addCustomIncome(plan, entry))}
                onRemove={handleRemoveItem}
                onGenerate13th={() => commit(regenerate13th(plan))}
              />
            </div>
            <div className="lg:col-span-3">
              <ExpenseList
                month={month}
                expenses={data.expenses}
                balanceAfter={sim.balanceAfter}
                onTogglePaid={(key) => commit(togglePaid(plan, key))}
                onEditAmount={(occ, amount, fwd) => commit(applyOverride(plan, occ, amount, fwd))}
                onEditItem={handleEditItem}
                onAddExpense={(entry) => commit(addCustomExpense(plan, entry))}
                onRemove={handleRemoveItem}
              />
            </div>
          </div>

          {/* Visão Geral Anual (Todos os Meses) */}
          <YearOverview
            plan={plan}
            months={months}
            current={month}
            onSelect={setMonth}
          />
        </>
      )}
    </main>
  );
}
