"use client";
import { useState } from "react";

export default function PlanTabs({
  plans,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onOpenComparison,
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [copyFrom, setCopyFrom] = useState("");
  const [gross, setGross] = useState("");
  const [net, setNet] = useState("");
  const [busy, setBusy] = useState(false);

  // Estado para exclusão e edição do plano
  const [planToDelete, setPlanToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onCreate({
        name: name.trim(),
        copyFrom: copyFrom || undefined,
        gross: gross ? parseFloat(String(gross).replace(",", ".")) : undefined,
        net: net ? parseFloat(String(net).replace(",", ".")) : undefined,
      });
      setName("");
      setCopyFrom("");
      setGross("");
      setNet("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const startRename = (p, e) => {
    e.stopPropagation();
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveRename = (id, e) => {
    if (e) e.preventDefault();
    if (editName.trim() && onRename) {
      onRename(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleDeleteClick = (p, e) => {
    e.stopPropagation();
    if (plans.length <= 1) {
      return;
    }
    setPlanToDelete(p);
  };

  const confirmDelete = async () => {
    if (!planToDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete(planToDelete.id);
      setPlanToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-end gap-1.5">
          {plans.map((p) => {
            const active = p.id === activeId;
            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                className={`group flex items-center rounded-xl border transition-all ${
                  active
                    ? "border-indigo-500/40 bg-white shadow-xs dark:border-indigo-500/50 dark:bg-slate-900"
                    : "border-transparent bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                }`}
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => saveRename(p.id, e)}
                    className="flex items-center gap-1 px-2 py-1.5"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-32 rounded-lg border border-indigo-400 bg-white px-2 py-0.5 text-xs font-bold text-slate-800 shadow-xs dark:border-indigo-500 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="submit"
                      title="Salvar nome"
                      className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      title="Cancelar"
                      className="rounded-md px-1.5 py-0.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelect(p.id)}
                      className="px-3.5 py-2 text-left"
                    >
                      <span
                        className={`text-xs font-bold ${
                          active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {p.name}
                      </span>
                    </button>

                    <div className="flex items-center gap-0.5 pr-2">
                      {/* Botão de Renomear Título */}
                      <button
                        type="button"
                        onClick={(e) => startRename(p, e)}
                        title={`Editar título de ${p.name}`}
                        aria-label={`Editar título de ${p.name}`}
                        className="opacity-40 group-hover:opacity-100 hover:!opacity-100 rounded-md p-1 text-xs text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 transition-all"
                      >
                        ✎
                      </button>

                      {/* Botão de Excluir Plano Inteiro */}
                      {plans.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(p, e)}
                          title={`Excluir ${p.name}`}
                          aria-label={`Excluir ${p.name}`}
                          className="rounded-md p-1 text-xs font-bold text-slate-400 opacity-60 hover:opacity-100 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-all"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl border border-dashed border-indigo-300 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
          >
            + Novo Plano
          </button>
        </div>

        {/* Botão de Comparação de Cenários */}
        {onOpenComparison && (
          <button
            type="button"
            onClick={onOpenComparison}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition-all hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          >
            <span>⚖️</span>
            <span>Comparar Cenários</span>
          </button>
        )}
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-indigo-200/80 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/30"
        >
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="mb-1 block font-semibold">Nome do plano</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Plano D — Viagem"
              className="w-48 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="mb-1 block font-semibold">Salário Bruto (R$)</span>
            <input
              type="number"
              step="0.01"
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              placeholder="Ex.: 3772,11"
              className="w-32 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="mb-1 block font-semibold">Salário Líquido (R$)</span>
            <input
              type="number"
              step="0.01"
              value={net}
              onChange={(e) => setNet(e.target.value)}
              placeholder="Ex.: 3271,54"
              className="w-32 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            <span className="mb-1 block font-semibold">Começar a partir de</span>
            <select
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Plano limpo em branco (sem entradas nem saídas padrão)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  Cópia de {p.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              disabled={busy}
              className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              Criar Plano
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {planToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-plan-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setPlanToDelete(null)}
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
                <h3 id="delete-plan-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Excluir Plano?
                </h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Ação permanente e irreversível
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-rose-300">
              Tem certeza que deseja excluir o plano <strong>&ldquo;{planToDelete.name}&rdquo;</strong>? Todas as receitas, despesas e configurações associadas serão apagadas permanentemente.
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPlanToDelete(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Excluir definitivamente</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
