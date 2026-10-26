"use client";
import { useState } from "react";
import { brl } from "@/lib/finance.mjs";

export default function EditSalaryModal({ plan, onSave, onClose }) {
  const currentGross = plan?.salary?.gross ?? 0;
  const currentNet = plan?.salary?.net ?? 0;

  const [gross, setGross] = useState(String(currentGross));
  const [net, setNet] = useState(String(currentNet));
  const [recalculate13th, setRecalculate13th] = useState(true);
  const [busy, setBusy] = useState(false);

  const numGross = parseFloat(String(gross).replace(",", ".")) || 0;
  const numNet = parseFloat(String(net).replace(",", ".")) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numGross < 0 || numNet < 0) return;
    setBusy(true);
    try {
      await onSave({
        gross: numGross,
        net: numNet,
        recalculate13th,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-lg text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              💼
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Editar Salário do Plano
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plano ativo: <strong>{plan.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Salário Bruto (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={gross}
              onChange={(e) => setGross(e.target.value)}
              placeholder="Ex.: 4500,00"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              Usado para estimar a 1ª parcela do 13º salário (50% do bruto).
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Salário Líquido Mensal (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={net}
              onChange={(e) => setNet(e.target.value)}
              placeholder="Ex.: 3800,00"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="mt-1 block text-[11px] text-slate-400">
              Valor líquido real que entra na conta corrente.
            </span>
          </div>

          <label className="flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-indigo-950 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-300 cursor-pointer">
            <input
              type="checkbox"
              checked={recalculate13th}
              onChange={(e) => setRecalculate13th(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-indigo-600"
            />
            <span>
              <strong>Recalcular parcelas estimadas do 13º salário</strong> (1ª parcela em novembro e 2ª parcela em dezembro).
            </span>
          </label>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {busy ? "Salvando..." : "Salvar Salário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
