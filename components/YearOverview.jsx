"use client";
import { brl, isMonthClosed, monthLabel, summarize } from "@/lib/finance.mjs";

// Visão geral dos meses do plano (clique numa linha para abrir o mês).
export default function YearOverview({ plan, months, current, onSelect }) {
  // Totais do período
  const totals = months.reduce(
    (acc, m) => {
      const s = summarize(plan, m);
      acc.entradas += s.entradas;
      acc.saidas += s.saidas;
      acc.sobra += s.sobra;
      acc.reserva += s.reserva;
      acc.caixa += s.caixa;
      return acc;
    },
    { entradas: 0, saidas: 0, sobra: 0, reserva: 0, caixa: 0 }
  );

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Visão Geral dos Meses (Projeção Completa)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clique em qualquer mês para abrir e editar os lançamentos daquele período.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/95 dark:bg-slate-800/95">
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="py-2.5 px-3">Mês</th>
              <th className="py-2.5 px-3 text-right">Entradas</th>
              <th className="py-2.5 px-3 text-right">Saídas</th>
              <th className="py-2.5 px-3 text-right">Sobra</th>
              <th className="py-2.5 px-3 text-right">Reserva (50%)</th>
              <th className="py-2.5 px-3 text-right">Caixa Livre (50%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {months.map((m, idx) => {
              const s = summarize(plan, m);
              const isCurrent = m === current;
              const closed = isMonthClosed(plan, m);
              const prevClosed = idx > 0 && isMonthClosed(plan, months[idx - 1]);
              const surplusRatio = s.entradas > 0 ? (s.sobra / s.entradas) * 100 : 0;

              return (
                <tr
                  key={m}
                  onClick={() => onSelect(m)}
                  className={`group cursor-pointer transition-colors ${
                    isCurrent
                      ? "bg-indigo-50/90 font-semibold text-indigo-950 dark:bg-indigo-950/45 dark:text-indigo-200"
                      : closed
                      ? "bg-emerald-50/40 text-slate-700 dark:bg-emerald-950/20 dark:text-slate-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30"
                      : "hover:bg-slate-50/90 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <td className="py-2.5 px-3.5 font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="text-slate-900 dark:text-slate-100">{monthLabel(m)}</span>
                      {isCurrent && (
                        <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                          atual
                        </span>
                      )}
                      {closed && (
                        <span title="Mês fechado" className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                          🔒 fechado
                        </span>
                      )}
                      {!closed && prevClosed && (
                        <span title="Caixa carregado do mês anterior" className="rounded-md bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/60 dark:text-teal-300">
                          ↗ carry
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                    {brl(s.entradas)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {brl(s.saidas)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden sm:block w-14 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.sobra >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                          style={{
                            width: `${Math.min(100, Math.max(8, Math.abs(surplusRatio)))}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`font-bold tabular-nums ${
                          s.sobra < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {brl(s.sobra)}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-indigo-600 dark:text-indigo-400 font-medium">
                    {brl(s.reserva)}
                  </td>
                  <td
                    className={`py-2.5 px-3.5 text-right tabular-nums ${
                      s.caixa < 0
                        ? "text-rose-600 dark:text-rose-400 font-bold"
                        : closed
                        ? "font-bold text-emerald-700 dark:text-emerald-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {brl(s.caixa)}
                    {closed && s.caixa > 0 && (
                      <span className="ml-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">→ próx</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50/90 font-bold dark:border-slate-700 dark:bg-slate-800/80">
            <tr className="text-xs uppercase">
              <td className="py-3 px-3 text-slate-900 dark:text-white">
                Total Acumulado ({months.length} meses)
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                {brl(totals.entradas)}
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-slate-800 dark:text-slate-200">
                {brl(totals.saidas)}
              </td>
              <td
                className={`py-3 px-3 text-right tabular-nums ${
                  totals.sobra < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {brl(totals.sobra)}
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-indigo-600 dark:text-indigo-400">
                {brl(totals.reserva)}
              </td>
              <td
                className={`py-3 px-3 text-right tabular-nums ${
                  totals.caixa < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {brl(totals.caixa)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
