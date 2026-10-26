"use client";
import { useMemo } from "react";
import { brl, calculatePlanMetrics } from "@/lib/finance.mjs";

export default function PlanComparisonModal({ plansData, activeId, onSelectPlan, onClose }) {
  // plansData é um array de objetos de planos completos [{ id, name, focus, ... }]
  const metrics = useMemo(() => {
    if (!Array.isArray(plansData)) return [];
    return plansData.map((p) => calculatePlanMetrics(p)).filter(Boolean);
  }, [plansData]);

  // Identificar destaques
  const highestSurplusId = useMemo(() => {
    if (!metrics.length) return null;
    return [...metrics].sort((a, b) => b.totalSurplus - a.totalSurplus)[0]?.id;
  }, [metrics]);

  const safestId = useMemo(() => {
    if (!metrics.length) return null;
    return [...metrics].sort((a, b) => a.dangerMonthCount - b.dangerMonthCount || b.finalClosing - a.finalClosing)[0]?.id;
  }, [metrics]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Comparativo de Cenários (Planos)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compare a projeção de 14 meses (nov/2026 → dez/2027) entre todos os seus planos.
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

        {metrics.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Carregando dados dos planos para comparação...
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white py-3 pr-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                    Métrica (14 meses)
                  </th>
                  {metrics.map((m) => {
                    const isActive = m.id === activeId;
                    const isHighest = m.id === highestSurplusId;
                    const isSafest = m.id === safestId;
                    return (
                      <th
                        key={m.id}
                        className={`min-w-[11rem] p-3 rounded-t-xl transition-colors ${
                          isActive
                            ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-t-2 border-indigo-600"
                            : "bg-slate-50/60 dark:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {m.name}
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              Ativo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 truncate">
                          {m.focus}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {isHighest && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              🏆 Maior Sobra
                            </span>
                          )}
                          {isSafest && (
                            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                              🛡️ Mais Seguro
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {/* Total Entradas */}
                <tr>
                  <td className="sticky left-0 bg-white py-2.5 pr-4 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    Total de Entradas
                  </td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {brl(m.totalIncomes)}
                    </td>
                  ))}
                </tr>

                {/* Total Despesas */}
                <tr>
                  <td className="sticky left-0 bg-white py-2.5 pr-4 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    Total de Saídas
                  </td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-3 font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {brl(m.totalExpenses)}
                    </td>
                  ))}
                </tr>

                {/* Fixos */}
                <tr className="text-slate-500 dark:text-slate-400">
                  <td className="sticky left-0 bg-white py-2 pr-4 pl-3 dark:bg-slate-900">
                    ↳ Gastos Fixos
                  </td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-3 tabular-nums">
                      {brl(m.totalFixed)}
                    </td>
                  ))}
                </tr>

                {/* Dívidas */}
                <tr className="text-slate-500 dark:text-slate-400">
                  <td className="sticky left-0 bg-white py-2 pr-4 pl-3 dark:bg-slate-900">
                    ↳ Dívidas & Financiamentos
                  </td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-3 tabular-nums">
                      {brl(m.totalDebts)}
                    </td>
                  ))}
                </tr>

                {/* Sobra Total */}
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 font-bold">
                  <td className="sticky left-0 bg-slate-50/90 py-3 pr-4 text-slate-900 dark:bg-slate-900/90 dark:text-white">
                    Sobra Total no Período
                  </td>
                  {metrics.map((m) => (
                    <td
                      key={m.id}
                      className={`p-3 text-sm tabular-nums ${
                        m.totalSurplus < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {brl(m.totalSurplus)}
                    </td>
                  ))}
                </tr>

                {/* Média de Sobra Mensal */}
                <tr>
                  <td className="sticky left-0 bg-white py-2.5 pr-4 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    Média de Sobra Mensal
                  </td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-3 tabular-nums font-medium">
                      {brl(m.avgMonthlySurplus)}/mês
                    </td>
                  ))}
                </tr>

                {/* Reserva Acumulada */}
                <tr>
                  <td className="sticky left-0 bg-white py-2.5 pr-4 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    Reserva Acumulada
                  </td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-3 font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {brl(m.totalReserve)}
                    </td>
                  ))}
                </tr>

                {/* Saldo de Caixa Final */}
                <tr>
                  <td className="sticky left-0 bg-white py-2.5 pr-4 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    Saldo Final em Dez/2027
                  </td>
                  {metrics.map((m) => (
                    <td
                      key={m.id}
                      className={`p-3 font-bold tabular-nums ${
                        m.finalClosing < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {brl(m.finalClosing)}
                    </td>
                  ))}
                </tr>

                {/* Meses com Alerta de Falta de Saldo */}
                <tr>
                  <td className="sticky left-0 bg-white py-2.5 pr-4 font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    Meses com Alerta de Saldo 🚨
                  </td>
                  {metrics.map((m) => (
                    <td key={m.id} className="p-3">
                      {m.dangerMonthCount === 0 ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          0 meses (tranquilo)
                        </span>
                      ) : (
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {m.dangerMonthCount} de {m.monthsCount} meses
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Ação de Selecionar */}
                <tr>
                  <td className="sticky left-0 bg-white py-4 pr-4 dark:bg-slate-900" />
                  {metrics.map((m) => {
                    const isActive = m.id === activeId;
                    return (
                      <td key={m.id} className="p-3">
                        {isActive ? (
                          <div className="py-2 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            Plano em Edição
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPlan(m.id);
                              onClose();
                            }}
                            className="w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-600"
                          >
                            Ativar este Plano
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
