"use client";
import { useMemo, useState } from "react";
import { brl, calculateBucketBalances, daysInMonth, getPlanBuckets, monthLabel } from "@/lib/finance.mjs";

export default function TransferModal({
  month,
  summary,
  plan,
  initialConfig = {},
  onAddTransfer,
  onRemoveTransfer,
  onClose,
}) {
  const buckets = useMemo(() => calculateBucketBalances(plan, month), [plan, month]);
  const principalBucket = buckets.find((b) => b.id === "principal") || { id: "principal", name: "Reserva Principal", balance: 0 };

  // Modo: 'caixa_principal' (Caixa Livre ⇄ Reserva Principal) ou 'buckets' (Entre Caixinhas)
  const [mode, setMode] = useState(initialConfig.mode || (initialConfig.to && initialConfig.to !== "principal" ? "buckets" : "caixa_principal"));

  // Modo 1: Caixa ⇄ Principal
  const [direction, setDirection] = useState("caixa_to_principal"); // 'caixa_to_principal' | 'principal_to_caixa'

  // Modo 2: Caixinha ⇄ Caixinha
  const [fromBucket, setFromBucket] = useState(initialConfig.from || "principal");
  const [toBucket, setToBucket] = useState(
    initialConfig.to && initialConfig.to !== "principal"
      ? initialConfig.to
      : buckets.find((b) => b.id !== "principal")?.id || "principal"
  );

  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [note, setNote] = useState("");

  const numAmount = parseFloat(String(amount).replace(",", ".")) || 0;

  // Saldos base
  const currentCaixa = summary?.caixa || 0;
  const currentPrincipal = principalBucket.balance || 0;

  const isAporte = direction === "caixa_to_principal";
  const projectedCaixa = isAporte ? currentCaixa - numAmount : currentCaixa + numAmount;
  const projectedPrincipal = isAporte ? currentPrincipal + numAmount : currentPrincipal - numAmount;

  // Para modo Caixinha ⇄ Caixinha
  const sourceBucketObj = buckets.find((b) => b.id === fromBucket) || principalBucket;
  const targetBucketObj = buckets.find((b) => b.id === toBucket) || principalBucket;
  const projectedSource = (sourceBucketObj.balance || 0) - numAmount;
  const projectedTarget = (targetBucketObj.balance || 0) + numAmount;

  const transfersInMonth = summary?.transfers || [];

  const handleQuickAmount = (val) => {
    setAmount(String(val));
  };

  const handleMaxSource = () => {
    if (mode === "caixa_principal") {
      if (isAporte && currentCaixa > 0) setAmount(String(currentCaixa));
      if (!isAporte && currentPrincipal > 0) setAmount(String(currentPrincipal));
    } else {
      if (sourceBucketObj.balance > 0) setAmount(String(sourceBucketObj.balance));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!(numAmount > 0)) return;

    if (mode === "caixa_principal") {
      onAddTransfer({
        month,
        day: parseInt(day, 10) || 1,
        from: isAporte ? "caixa" : "principal",
        to: isAporte ? "principal" : "caixa",
        amount: numAmount,
        note: note.trim(),
      });
    } else {
      if (fromBucket === toBucket) return;
      onAddTransfer({
        month,
        day: parseInt(day, 10) || 1,
        from: fromBucket,
        to: toBucket,
        amount: numAmount,
        note: note.trim(),
      });
    }

    setAmount("");
    setNote("");
  };

  const handleSwapBuckets = () => {
    const temp = fromBucket;
    setFromBucket(toBucket);
    setToBucket(temp);
  };

  const maxDay = daysInMonth(month);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-sm">
                ⇄
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Movimentação Financeira
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Mês de referência: <strong className="text-slate-700 dark:text-slate-300">{monthLabel(month)}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Abas de Modo de Transferência */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode("caixa_principal")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === "caixa_principal"
                ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Caixa Livre ⇄ Reserva Principal
          </button>
          <button
            type="button"
            onClick={() => setMode("buckets")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === "buckets"
                ? "bg-white text-indigo-700 shadow-xs dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            Entre Caixinhas da Reserva
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === "caixa_principal" ? (
            /* Modo 1: Caixa ⇄ Principal */
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Direção da Movimentação
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("caixa_to_principal")}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    isAporte
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>💳 ➔ 🛡️</span>
                    <span>Aportar na Reserva</span>
                  </div>
                  <div className="mt-1 text-[11px] opacity-80">
                    Transfere do caixa livre para a Reserva Principal
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDirection("principal_to_caixa")}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    !isAporte
                      ? "border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>🛡️ ➔ 💳</span>
                    <span>Resgatar da Reserva</span>
                  </div>
                  <div className="mt-1 text-[11px] opacity-80">
                    Retira da Reserva Principal e devolve ao caixa livre
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Modo 2: Caixinha ⇄ Caixinha */
            <div>
              <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Origem
                  </label>
                  <select
                    value={fromBucket}
                    onChange={(e) => setFromBucket(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {buckets.map((b) => (
                      <option key={b.id} value={b.id} disabled={b.id === toBucket}>
                        {b.icon} {b.name} ({brl(b.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleSwapBuckets}
                  title="Inverter origem e destino"
                  className="mt-5 rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  ⇄
                </button>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destino
                  </label>
                  <select
                    value={toBucket}
                    onChange={(e) => setToBucket(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {buckets.map((b) => (
                      <option key={b.id} value={b.id} disabled={b.id === fromBucket}>
                        {b.icon} {b.name} ({brl(b.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Valor */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Valor da Movimentação (R$)
              </label>
              <button
                type="button"
                onClick={handleMaxSource}
                className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Usar saldo total da origem
              </button>
            </div>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold tabular-nums text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            {/* Atalhos de Valor */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[50, 100, 200, 500].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleQuickAmount(v)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  +{brl(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Dia e Observação */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dia do Mês (Efetivação)
              </label>
              <input
                type="number"
                min="1"
                max={maxDay}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Motivo / Observação (opcional)
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex.: Aporte extra / Viagem fim de ano"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Projeção dos Saldos Resultantes */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Projeção dos Saldos Resultantes
            </span>
            {mode === "caixa_principal" ? (
              <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Caixa Livre:</span>
                  <div className="font-bold tabular-nums">
                    <span className="text-slate-400 line-through mr-1">{brl(currentCaixa)}</span>
                    <span className={projectedCaixa < 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}>
                      {brl(projectedCaixa)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Reserva Principal:</span>
                  <div className="font-bold tabular-nums">
                    <span className="text-slate-400 line-through mr-1">{brl(currentPrincipal)}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {brl(projectedPrincipal)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Origem ({sourceBucketObj.name}):</span>
                  <div className="font-bold tabular-nums">
                    <span className="text-slate-400 line-through mr-1">{brl(sourceBucketObj.balance)}</span>
                    <span className={projectedSource < 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}>
                      {brl(projectedSource)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400">Destino ({targetBucketObj.name}):</span>
                  <div className="font-bold tabular-nums">
                    <span className="text-slate-400 line-through mr-1">{brl(targetBucketObj.balance)}</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {brl(projectedTarget)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão de Envio */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              Confirmar Movimentação
            </button>
          </div>
        </form>

        {/* Histórico de Movimentações no Mês */}
        {transfersInMonth.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
              Movimentações Realizadas em {monthLabel(month)}
            </h3>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {transfersInMonth.map((t) => {
                const getBucketName = (id) => {
                  if (id === "caixa") return "Caixa Livre";
                  if (id === "principal" || id === "reserva") return "Reserva Principal";
                  const b = buckets.find((bkt) => bkt.id === id);
                  return b ? b.name : id;
                };

                return (
                  <li key={t.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {getBucketName(t.from)} ➔ {getBucketName(t.to)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Dia {t.day} {t.note ? `• ${t.note}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                        {brl(t.amount)}
                      </span>
                      {onRemoveTransfer && (
                        <button
                          type="button"
                          onClick={() => onRemoveTransfer(t.id)}
                          title="Remover movimentação"
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
