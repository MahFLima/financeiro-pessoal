"use client";
import { useState } from "react";
import { brl, CATEGORIES, daysInMonth, fmtDate } from "@/lib/finance.mjs";
import AmountCell from "./AmountCell";

const CATEGORY_META = {
  fixo: { label: "Fixos", icon: "🏠", badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" },
  variavel: { label: "Variáveis", icon: "🛒", badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  divida: { label: "Dívidas & Cartão", icon: "💳", badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800" },
};

const ORDER = ["fixo", "variavel", "divida"];

function Row({ month, o, balanceAfter, onTogglePaid, onEditAmount, onEditItem, onConfirmDelete }) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const short = balanceAfter !== undefined && balanceAfter < -0.005 && !o.paid;

  const openEdit = () => {
    setEditForm({
      description: o.description,
      note: o.note || "",
      day: String(o.day),
      category: o.category || "variavel",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    const day = Math.min(Math.max(1, parseInt(editForm.day, 10) || o.day), daysInMonth(month));
    onEditItem(o.itemId, {
      description: editForm.description.trim() || o.description,
      note: editForm.note.trim() || undefined,
      day,
      category: editForm.category,
    });
    setEditing(false);
  };



  return (
    <li className={`rounded-xl transition-all ${o.paid ? "opacity-55" : ""}`}>
      <div
        className={`group flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-2.5 py-2.5 transition-colors ${
          o.paid ? "hover:opacity-85" : "hover:bg-slate-50/90 dark:hover:bg-slate-800/50"
        }`}
      >
        {/* Checkbox customizado com animação */}
        <button
          type="button"
          role="checkbox"
          aria-checked={o.paid}
          onClick={() => onTogglePaid(o.key)}
          aria-label={`Marcar ${o.description} como pago`}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded transition-all duration-150 ${
            o.paid
              ? "bg-emerald-600 text-white shadow-2xs scale-100"
              : "border-2 border-slate-300 hover:border-emerald-500 dark:border-slate-600 dark:hover:border-emerald-500 bg-white dark:bg-slate-800 hover:scale-105"
          }`}
        >
          {o.paid && (
            <svg className="h-3 w-3 stroke-current" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <span className="w-16 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
          dia {String(o.day).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`truncate text-sm font-semibold transition-all ${
                o.paid ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {o.description}
            </span>

            {o.installment && o.installments && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400 tabular-nums">
                {o.installment}/{o.installments}
              </span>
            )}
            {o.recurring && !o.installments && (
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                recorrente
              </span>
            )}
          </div>
          {o.note && <div className="text-[11px] text-slate-400 dark:text-slate-500">{o.note}</div>}
          {short && (
            <div className="mt-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              ⚠️ Saldo insuficiente: fechará em {brl(balanceAfter)}
            </div>
          )}
        </div>

        <AmountCell occ={o} onChange={onEditAmount} />

        <div className="flex items-center gap-1">
          {/* Botão Editar */}
          <button
            type="button"
            onClick={openEdit}
            title="Editar lançamento"
            className="rounded-lg p-1.5 text-slate-400 opacity-60 hover:opacity-100 group-hover:opacity-100 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-all"
          >
            ✎
          </button>
          {/* Botão Excluir */}
          <button
            type="button"
            onClick={() => onConfirmDelete(o)}
            title="Excluir lançamento"
            className="rounded-lg p-1.5 text-slate-400 opacity-60 hover:opacity-100 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Painel de Edição Inline */}
      {editing && (
        <div className="mx-2 mb-3 rounded-2xl border border-indigo-200/90 bg-indigo-50/70 p-3.5 shadow-xs dark:border-indigo-900/50 dark:bg-indigo-950/40">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            Editar lançamento
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
              Descrição
              <input
                autoFocus
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Dia do mês
              <input
                type="number"
                min="1"
                max={daysInMonth(month)}
                value={editForm.day}
                onChange={(e) => setEditForm({ ...editForm, day: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Categoria
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="variavel">🛒 Variável</option>
                <option value="fixo">🏠 Fixo</option>
                <option value="divida">💳 Dívida</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2 lg:col-span-4">
              Observação
              <input
                value={editForm.note}
                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                placeholder="Nota opcional..."
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>
          <div className="mt-2.5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-2xs"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function ExpenseList({
  month,
  expenses,
  balanceAfter,
  onTogglePaid,
  onEditAmount,
  onEditItem,
  onAddExpense,
  onRemove,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'unpaid' | 'paid'
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const confirmDeleteExpense = () => {
    if (!itemToDelete) return;
    onRemove(itemToDelete.itemId, month);
    setItemToDelete(null);
  };

  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "variavel",
    recurrence: "once", // 'once' | 'monthly' | 'installments'
    installments: "2",
    date: "",
    paid: false,
    note: "",
  });

  const date = form.date && form.date.startsWith(month) ? form.date : `${month}-01`;

  const submit = (e) => {
    e.preventDefault();
    const amount = parseFloat(String(form.amount).replace(",", "."));
    if (!form.description.trim() || !(amount > 0)) return;

    if (onAddExpense) {
      onAddExpense({
        description: form.description.trim(),
        category: form.category,
        amount,
        date,
        recurrence: form.recurrence,
        installments: form.recurrence === "installments" ? parseInt(form.installments, 10) || 1 : null,
        paid: form.paid,
        note: form.note,
      });
    }

    setForm({
      description: "",
      amount: "",
      category: "variavel",
      recurrence: "once",
      installments: "2",
      date: "",
      paid: false,
      note: "",
    });
    setShowAddForm(false);
  };

  // Filtragem
  const filteredExpenses = expenses.filter((e) => {
    const matchSearch =
      !search ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.note && e.note.toLowerCase().includes(search.toLowerCase()));
    const matchStatus =
      statusFilter === "all" ? true : statusFilter === "paid" ? e.paid : !e.paid;
    return matchSearch && matchStatus;
  });

  const totalFiltered = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Saídas</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {expenses.length} contas
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700"
        >
          {showAddForm ? "Fechar Formulário" : "+ Nova Saída"}
        </button>
      </div>

      {/* Barra de Busca e Filtros Rápidos */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar despesa por nome..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-1 rounded-xl bg-slate-100 p-0.5 text-xs dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              statusFilter === "all"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("unpaid")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              statusFilter === "unpaid"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Pendentes
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("paid")}
            className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
              statusFilter === "paid"
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Pagas
          </button>
        </div>
      </div>

      {/* Formulário Avançado de Adição de Saída */}
      {showAddForm && (
        <form
          onSubmit={submit}
          className="mb-5 space-y-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 shadow-inner dark:border-indigo-900/40 dark:bg-indigo-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Cadastrar Nova Saída
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Descrição
              <input
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex.: Mercado, Seguro, Academia..."
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>

            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Valor (R$)
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>

            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Categoria
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="variavel">Variável (gastos avulsos do mês)</option>
                <option value="fixo">Fixo (contas recorrentes de casa, serviços)</option>
                <option value="divida">Dívida (cartões, financiamentos, empréstimos)</option>
              </select>
            </label>

            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Recorrência
              <select
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="once">Somente neste mês</option>
                <option value="monthly">Recorrente todo mês (sem fim)</option>
                <option value="installments">Parcelado em N vezes</option>
              </select>
            </label>

            {form.recurrence === "installments" && (
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Quantidade de Parcelas
                <input
                  type="number"
                  min="2"
                  max="72"
                  value={form.installments}
                  onChange={(e) => setForm({ ...form, installments: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
            )}

            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Data de Vencimento
              <input
                type="date"
                value={date}
                min={`${month}-01`}
                max={`${month}-${String(daysInMonth(month)).padStart(2, "0")}`}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>

            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
              Observação (opcional)
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Ex.: Cartão final 1234 / juros variáveis..."
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>

            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.paid}
                  onChange={(e) => setForm({ ...form, paid: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-600"
                />
                Já está pago
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              Salvar Saída
            </button>
          </div>
        </form>
      )}

      {/* Lista agrupada por categoria */}
      <div className="space-y-4">
        {ORDER.map((cat) => {
          const list = filteredExpenses.filter((e) => e.category === cat);
          const total = list.reduce((s, e) => s + e.amount, 0);
          const paid = list.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0);

          return (
            <div
              key={cat}
              className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3.5 shadow-2xs dark:border-slate-800/80 dark:bg-slate-900/40"
            >
              <div className="mb-2 flex items-center justify-between border-b border-slate-200/60 pb-2 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{CATEGORY_META[cat]?.icon}</span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {CATEGORY_META[cat]?.label || CATEGORIES[cat]}
                  </h3>
                </div>
                <div className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{brl(paid)}</span> pagos de{" "}
                  <strong className="text-slate-900 dark:text-white">{brl(total)}</strong>
                </div>
              </div>

              <ul className="divide-y divide-slate-100/80 dark:divide-slate-800/40">
                {list.length === 0 ? (
                  <li className="py-2 text-xs text-slate-400 dark:text-slate-500">
                    Nenhuma saída em {CATEGORIES[cat].toLowerCase()} neste filtro.
                  </li>
                ) : (
                  list.map((o) => (
                    <Row
                      key={o.key}
                      month={month}
                      o={o}
                      balanceAfter={balanceAfter[o.key]}
                      onTogglePaid={onTogglePaid}
                      onEditAmount={onEditAmount}
                      onEditItem={onEditItem}
                      onConfirmDelete={setItemToDelete}
                    />
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmação de Exclusão de Saída */}
      {itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setItemToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Excluir Saída?
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {itemToDelete.recurring ? "Despesa recorrente" : "Despesa pontual"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-rose-300">
              Tem certeza que deseja excluir <strong>&ldquo;{itemToDelete.description}&rdquo;</strong> ({brl(itemToDelete.amount)})?
              {itemToDelete.recurring && (
                <span className="block mt-1 font-semibold text-rose-700 dark:text-rose-400">
                  ⚠️ Por ser recorrente, esta saída será removida de todos os meses do plano.
                </span>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteExpense}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
