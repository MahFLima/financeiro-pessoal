"use client";
import { useState } from "react";
import { brl } from "@/lib/finance.mjs";

// Valor clicável que vira campo de edição.
// "Só este mês" grava um override da ocorrência; "Este e próximos" replica nos meses seguintes.
export default function AmountCell({ occ, onChange, className = "" }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const start = () => {
    setValue(String(occ.amount));
    setEditing(true);
  };
  const commit = (forward) => {
    const n = parseFloat(String(value).replace(",", "."));
    if (Number.isFinite(n) && n >= 0) onChange(occ, n, forward);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        title="Clique para editar o valor"
        className={`rounded-lg px-2 py-0.5 text-right font-semibold tabular-nums transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
          occ.overridden ? "text-amber-600 dark:text-amber-400 font-bold" : ""
        } ${className}`}
      >
        {brl(occ.amount)}
        {occ.overridden && <span className="ml-1 text-[11px]" title="Valor editado manualmente">✎</span>}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <input
        autoFocus
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(false);
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-xs font-semibold tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      <button
        type="button"
        onClick={() => commit(false)}
        className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white shadow-xs hover:bg-indigo-700"
      >
        Só este mês
      </button>
      {occ.recurring && (
        <button
          type="button"
          onClick={() => commit(true)}
          className="rounded-lg bg-slate-700 px-2 py-1 text-xs font-medium text-white shadow-xs hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500"
        >
          Este e próximos
        </button>
      )}
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="rounded-lg p-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        ✕
      </button>
    </div>
  );
}
