"use client";
import { useState } from "react";
import { brl, daysInMonth, fmtDate } from "@/lib/finance.mjs";
import AmountCell from "./AmountCell";

export default function IncomeList({
  month,
  incomes,
  onEditAmount,
  onEditItem,
  onAddIncome,
  onRemove,
  onGenerate13th,
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: "",
    recurrence: "once", // 'once' | 'monthly'
    note: "",
  });

  const date = form.date && form.date.startsWith(month) ? form.date : `${month}-01`;

  const submit = (e) => {
    e.preventDefault();
    const amount = parseFloat(String(form.amount).replace(",", "."));
    if (!form.description.trim() || !(amount > 0)) return;

    if (onAddIncome) {
      onAddIncome({
        description: form.description.trim(),
        amount,
        date,
        recurrence: form.recurrence,
        note: form.note,
      });
    }

    setForm({ description: "", amount: "", date: "", recurrence: "once", note: "" });
    setShowForm(false);
  };

  const openEdit = (o) => {
    setEditingId(o.itemId);
    setEditForm({ description: o.description, note: o.note || "", day: String(o.day) });
  };

  const saveEdit = (o) => {
    const day = Math.min(Math.max(1, parseInt(editForm.day, 10) || o.day), daysInMonth(month));
    onEditItem(o.itemId, {
      description: editForm.description.trim() || o.description,
      note: editForm.note.trim() || undefined,
      day,
    });
    setEditingId(null);
  };

  const [itemToDelete, setItemToDelete] = useState(null);

  const confirmDelete = () => {
    if (!itemToDelete) return;
    onRemove(itemToDelete.itemId, month);
    setItemToDelete(null);
  };

  const filteredIncomes = incomes.filter((i) => {
    if (!search) return true;
    return (
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      (i.note && i.note.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const total = filteredIncomes.reduce((s, i) => s + i.amount, 0);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Entradas</h2>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            {brl(total)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
        >
          {showForm ? "Fechar" : "+ Nova Entrada"}
        </button>
      </div>

      {/* Busca rápida se houver mais de 3 itens */}
      {incomes.length > 3 && (
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar receita..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
          />
        </div>
      )}

      {/* Formulário de Adição */}
      {showForm && (
        <form
          onSubmit={submit}
          className="mb-4 space-y-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-inner dark:border-emerald-900/40 dark:bg-emerald-950/20"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Cadastrar Nova Receita
          </span>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Descrição
              <input
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex.: Freelance, Dividendos, Aluguel..."
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
              Recorrência
              <select
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="once">Somente neste mês</option>
                <option value="monthly">Recorrente todo mês</option>
              </select>
            </label>

            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Data de Recebimento
              <input
                type="date"
                value={date}
                min={`${month}-01`}
                max={`${month}-${String(daysInMonth(month)).padStart(2, "0")}`}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              Salvar Entrada
            </button>
          </div>
        </form>
      )}

      {/* Lista de Entradas */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredIncomes.length === 0 && (
          <li className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Nenhuma receita encontrada neste mês.
          </li>
        )}
        {filteredIncomes.map((o) => (
          <li key={o.key} className="rounded-xl">
            <div className="group flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/50">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                💰
              </span>

              <span className="w-14 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                dia {String(o.day).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {o.description}
                  </span>
                  {o.recurring && (
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                      recorrente
                    </span>
                  )}
                </div>
                {o.note && (
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">{o.note}</div>
                )}
              </div>

              <AmountCell
                occ={o}
                onChange={onEditAmount}
                className="text-emerald-700 dark:text-emerald-400 font-bold"
              />

              <div className="flex items-center gap-1">
                {/* Botão Editar */}
                <button
                  type="button"
                  onClick={() => openEdit(o)}
                  title="Editar receita"
                  className="rounded-lg p-1.5 text-slate-400 opacity-60 hover:opacity-100 group-hover:opacity-100 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-all"
                >
                  ✎
                </button>
                {/* Botão Excluir */}
                <button
                  type="button"
                  onClick={() => setItemToDelete(o)}
                  title="Excluir receita"
                  className="rounded-lg p-1.5 text-slate-400 opacity-60 hover:opacity-100 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Painel de Edição Inline */}
            {editingId === o.itemId && (
              <div className="mx-2 mb-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Editar receita
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
                    Descrição
                    <input
                      autoFocus
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 sm:col-span-3">
                    Observação
                    <input
                      value={editForm.note}
                      onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                      placeholder="Nota opcional..."
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </label>
                </div>
                <div className="mt-2.5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => saveEdit(o)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Botão de 13º Salário */}
      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          type="button"
          onClick={onGenerate13th}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <span>✨</span>
          <span>Gerar / recalcular 13º salário (parcelas de nov e dez)</span>
        </button>
      </div>

      {/* Modal de Confirmação de Exclusão de Entrada */}
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
                  Excluir Entrada?
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {itemToDelete.recurring ? "Entrada recorrente" : "Entrada pontual"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-rose-300">
              Tem certeza que deseja excluir <strong>&ldquo;{itemToDelete.description}&rdquo;</strong> ({brl(itemToDelete.amount)})?
              {itemToDelete.recurring && (
                <span className="block mt-1 font-semibold text-rose-700 dark:text-rose-400">
                  ⚠️ Por ser recorrente, esta entrada será removida de todos os meses do plano.
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
                onClick={confirmDelete}
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
