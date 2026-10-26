"use client";
import { useState } from "react";
import { brl, fmtDate, monthLabel } from "@/lib/finance.mjs";

function BalanceChart({ sim, month, hoveredDay, onHoverDay }) {
  const W = 720;
  const H = 180;
  const P = { l: 16, r: 16, t: 18, b: 26 };
  const n = sim.days.length;
  const vals = [sim.opening, ...sim.days.map((d) => d.closing), 0];
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const span = max - min || 1;

  const x = (d) => P.l + ((d - 1) / (n - 1 || 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - (v - min) / span) * (H - P.t - P.b);

  // Stepped cashflow line
  let linePath = `M ${x(1)} ${y(sim.opening)}`;
  let prev = sim.opening;
  sim.days.forEach((d) => {
    linePath += ` L ${x(d.day)} ${y(prev)} L ${x(d.day)} ${y(d.closing)}`;
    prev = d.closing;
  });

  // Closed area under the curve
  const areaPath = `${linePath} L ${x(n)} ${y(min)} L ${x(1)} ${y(min)} Z`;

  const hoveredData = hoveredDay ? sim.days.find((d) => d.day === hoveredDay) : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-48 w-full select-none overflow-visible"
        role="img"
        aria-label="Saldo projetado por dia"
        onMouseLeave={() => onHoverDay(null)}
      >
        <defs>
          <linearGradient id="balance-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
            <stop offset="80%" stopColor="#6366f1" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Linha Zero de Referência */}
        <line
          x1={P.l}
          x2={W - P.r}
          y1={y(0)}
          y2={y(0)}
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-700"
          strokeDasharray="4 4"
          strokeWidth="1.2"
        />
        <text
          x={W - P.r}
          y={y(0) - 5}
          textAnchor="end"
          fontSize="10"
          fontWeight="600"
          className="fill-slate-400 dark:fill-slate-500 tabular-nums"
        >
          R$ 0,00
        </text>

        {/* Área sob a curva */}
        <path d={areaPath} fill="url(#balance-gradient)" />

        {/* Linha do Saldo */}
        <path
          d={linePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinejoin="round"
          className="transition-all"
        />

        {/* Marcadores dos dias com eventos */}
        {sim.days
          .filter((d) => d.events.length)
          .map((d) => {
            const isNegative = d.closing < 0;
            const isHovered = hoveredDay === d.day;
            return (
              <g
                key={d.day}
                className="cursor-pointer transition-transform duration-150"
                onMouseEnter={() => onHoverDay(d.day)}
              >
                {/* Glow ao redor */}
                <circle
                  cx={x(d.day)}
                  cy={y(d.closing)}
                  r={isHovered ? 8 : 4.5}
                  fill={isNegative ? "#ef4444" : "#6366f1"}
                  opacity={isHovered ? 0.35 : 0.15}
                />
                <circle
                  cx={x(d.day)}
                  cy={y(d.closing)}
                  r={isHovered ? 5 : 3.5}
                  fill={isNegative ? "#dc2626" : "#4f46e5"}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2 : 1.5}
                  className="dark:stroke-slate-900"
                />
              </g>
            );
          })}

        {/* Indicador vertical do dia hovered */}
        {hoveredDay && (
          <line
            x1={x(hoveredDay)}
            x2={x(hoveredDay)}
            y1={P.t}
            y2={H - P.b}
            stroke="#818cf8"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}

        {/* Eixo X com dias */}
        {[1, 5, 10, 15, 20, 25, n].map((d) => (
          <text
            key={d}
            x={x(d)}
            y={H - 7}
            textAnchor="middle"
            fontSize="10"
            className="fill-slate-400 dark:fill-slate-500 font-semibold tabular-nums"
          >
            {d}
          </text>
        ))}
      </svg>

      {/* Tooltip flutuante interativo moderno */}
      {hoveredData && (
        <div
          className="pointer-events-none absolute top-2 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 z-20 text-xs transition-all max-w-xs animate-in fade-in"
          style={{
            left: `${Math.min(Math.max(8, ((hoveredData.day - 1) / (n - 1)) * 82), 68)}%`,
          }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              📅 {fmtDate(month, hoveredData.day)}
            </span>
            <span
              className={`font-extrabold tabular-nums ${
                hoveredData.closing < 0 ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400"
              }`}
            >
              Saldo: {brl(hoveredData.closing)}
            </span>
          </div>

          {hoveredData.events.length > 0 ? (
            <div className="mt-2.5 space-y-1.5">
              {hoveredData.events.map((e) => (
                <div key={e.key} className="flex items-center justify-between gap-2.5">
                  <span className="truncate text-slate-600 dark:text-slate-300">
                    {e.type === "in" ? "🟢" : "🔴"} {e.description}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      e.type === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {e.type === "in" ? "+" : "−"} {brl(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-slate-400">Sem lançamentos programados neste dia.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CashflowTimeline({ sim, month }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [filterMode, setFilterMode] = useState("events"); // 'events' | 'all'

  const danger = sim.alerts.filter((a) => a.level === "danger");
  const warn = sim.alerts.filter((a) => a.level === "warn");
  const displayedDays = filterMode === "events" ? sim.days.filter((d) => d.events.length) : sim.days;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all dark:border-slate-800/80 dark:bg-slate-900/90">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Fluxo de Caixa Diário — {monthLabel(month)}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Passe o mouse no gráfico para inspecionar os lançamentos e saldo de cada dia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Abertura: <strong className="text-slate-900 dark:text-white">{brl(sim.opening)}</strong>
          </span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Fechamento: <strong className="text-slate-900 dark:text-white">{brl(sim.closing)}</strong>
          </span>
          <span
            className={`rounded-lg px-2.5 py-1 font-medium ${
              sim.lowest.balance < 0
                ? "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
            }`}
          >
            Pior saldo: <strong>{brl(sim.lowest.balance)}</strong> (dia {String(sim.lowest.day).padStart(2, "0")})
          </span>
        </div>
      </div>

      {/* Alertas */}
      <div className="mb-4 space-y-2">
        {danger.map((a, i) => (
          <div
            key={`d${i}`}
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-900 shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          >
            <span className="text-base">🚨</span>
            <div>{a.message}</div>
          </div>
        ))}
        {warn.map((a, i) => (
          <div
            key={`w${i}`}
            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
          >
            <span className="text-base">⚠️</span>
            <div>{a.message}</div>
          </div>
        ))}
        {sim.alerts.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-900 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <span className="text-base">✅</span>
            <span className="font-medium">Saldo positivo e seguro durante todo o mês. Nenhuma conta sem cobertura.</span>
          </div>
        )}
      </div>

      {/* Gráfico Interativo */}
      <BalanceChart
        sim={sim}
        month={month}
        hoveredDay={hoveredDay}
        onHoverDay={setHoveredDay}
      />

      {/* Tabela de Movimentações */}
      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Detalhamento das Movimentações
          </span>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 text-xs dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setFilterMode("events")}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                filterMode === "events"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Com movimentação ({sim.days.filter((d) => d.events.length).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                filterMode === "all"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Todos os dias ({sim.days.length})
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm dark:bg-slate-800/95">
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="py-2 px-3">Data</th>
                <th className="py-2 px-3">Movimentos do Dia</th>
                <th className="py-2 px-3 text-right">Saldo Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {displayedDays.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">
                    Nenhum lançamento previsto.
                  </td>
                </tr>
              ) : (
                displayedDays.map((d) => (
                  <tr
                    key={d.day}
                    onMouseEnter={() => setHoveredDay(d.day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`transition-colors ${
                      hoveredDay === d.day
                        ? "bg-indigo-50/60 dark:bg-indigo-950/30"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {fmtDate(month, d.day)}
                    </td>
                    <td className="py-2 px-3">
                      {d.events.length === 0 ? (
                        <span className="text-xs text-slate-400">Sem lançamentos</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {d.events.map((e) => (
                            <span
                              key={e.key}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium shadow-xs ${
                                e.type === "in"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
                                  : "bg-slate-100 text-slate-700 border border-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                              }`}
                            >
                              <span>{e.type === "in" ? "+" : "−"}</span>
                              <span>{e.description}</span>
                              <strong className="tabular-nums">{brl(e.amount)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold tabular-nums ${
                        d.closing < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {brl(d.closing)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
