"use client";
import { useState } from "react";
import { brl, calculateBucketBalances } from "@/lib/finance.mjs";

const QUICK_ICONS = ["🛡️", "✈️", "🎮", "📱", "💻", "🚗", "🏠", "🎓", "💍", "🏖️", "👶", "💰"];

export default function ReserveBuckets({
  plan,
  month,
  onAddBucket,
  onUpdateBucket,
  onDeleteBucket,
  onOpenTransfer,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState(null);
  const [form, setForm] = useState({ name: "", icon: "🎯", target: "" });

  const buckets = calculateBucketBalances(plan, month);
  const totalReserve = buckets.reduce((s, b) => s + b.balance, 0);

  const openCreate = () => {
    setEditingBucket(null);
    setForm({ name: "", icon: "🎯", target: "" });
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditingBucket(b);
    setForm({
      name: b.name,
      icon: b.icon || "🎯",
      target: b.target ? String(b.target) : "",
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingBucket) {
      onUpdateBucket(editingBucket.id, {
        name: form.name.trim(),
        icon: form.icon.trim() || "🎯",
        target: form.target,
      });
    } else {
      onAddBucket({
        name: form.name.trim(),
        icon: form.icon.trim() || "🎯",
        target: form.target,
      });
    }
    setModalOpen(false);
  };

  const handleDelete = (b) => {
    if (b.id === "principal") return;
    if (
      confirm(
        `Excluir a caixinha "${b.name}"? Se houver saldo acumulado, ele será devolvido para a Reserva Principal.`
      )
    ) {
      onDeleteBucket(b.id);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Caixinhas da Reserva
            </h2>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 tabular-nums">
              Total: {brl(totalReserve)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Os 50% da sobra mensal entram na <strong>Reserva Principal</strong>. Distribua livremente entre suas metas.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <span>+</span>
          <span>Nova Caixinha</span>
        </button>
      </div>

      {/* Grid das Caixinhas */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {buckets.map((b) => {
          const isPrincipal = b.id === "principal";
          const hasTarget = b.target && b.target > 0;

          return (
            <div
              key={b.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                isPrincipal
                  ? "border-indigo-300/80 bg-gradient-to-br from-indigo-50/60 to-white shadow-xs dark:border-indigo-800/80 dark:from-indigo-950/40 dark:to-slate-900 ring-1 ring-indigo-500/10"
                  : "border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-slate-700 shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                      {b.icon || "🎯"}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {b.name}
                      </h3>
                      {isPrincipal && (
                        <span className="inline-block mt-0.5 rounded-md bg-indigo-100 px-1.5 py-0.2 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                          Hub Central
                        </span>
                      )}
                    </div>
                  </div>

                  {!isPrincipal && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => openEdit(b)}
                        title="Editar caixinha"
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b)}
                        title="Excluir caixinha"
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Saldo Acumulado
                  </span>
                  <div className="text-xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                    {brl(b.balance)}
                  </div>
                </div>

                {hasTarget && (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>Meta: {brl(b.target)}</span>
                      <span>{b.progressPct}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.progressPct >= 100
                            ? "bg-emerald-500"
                            : "bg-indigo-600 dark:bg-indigo-500"
                        }`}
                        style={{ width: `${Math.min(b.progressPct || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ações da Caixinha */}
              <div className="mt-4 pt-3 border-t border-slate-100/90 dark:border-slate-800/80 flex flex-wrap gap-1.5">
                {isPrincipal ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenTransfer({ mode: "caixa_principal" })}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      ⇄ Caixa Livre
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenTransfer({ from: "principal" })}
                      className="flex-1 rounded-xl bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition-colors"
                    >
                      ➔ Distribuir
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenTransfer({ to: b.id })}
                    className="w-full rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/80 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 transition-colors"
                  >
                    ⇄ Movimentar Saldo
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Criação / Edição de Caixinha */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingBucket ? "Editar Caixinha" : "Nova Caixinha de Reserva"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nome da Caixinha
                </label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex.: Viagem, Playstation, iPhone, PC Gamer"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ícone
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-16 text-center text-lg rounded-xl border border-slate-300 bg-white py-1.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <div className="flex flex-wrap gap-1">
                    {QUICK_ICONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setForm({ ...form, icon: emoji })}
                        className={`h-8 w-8 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform ${
                          form.icon === emoji ? "scale-110 bg-indigo-50 ring-2 ring-indigo-500" : ""
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Meta em R$ (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  placeholder="Ex.: 4500,00"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="mt-1 block text-[11px] text-slate-400">
                  Deixe vazio se não quiser estipular uma meta específica.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  {editingBucket ? "Salvar Alterações" : "Criar Caixinha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
