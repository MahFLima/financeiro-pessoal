"use client";
import { brl, monthLabel } from "@/lib/finance.mjs";

function Card({ label, value, sub, icon, tone = "slate", highlight = false, action = null }) {
  const tones = {
    slate: "border-slate-200/90 bg-white/95 text-slate-900 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100",
    green: "border-emerald-200/90 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200",
    red: "border-red-200/90 bg-red-50/70 text-red-950 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200",
    indigo: "border-indigo-200/90 bg-indigo-50/70 text-indigo-950 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200",
    amber: "border-amber-200/90 bg-amber-50/70 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200",
  };

  const badgeTones = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300",
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
  };

  return (
    <div
      className={`card-hover relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-xs backdrop-blur-sm ${
        highlight
          ? "border-amber-300 ring-2 ring-amber-400/25 dark:border-amber-500/50 dark:ring-amber-500/20"
          : tones[tone]
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {label}
            </span>
            {highlight && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-amber-700 dark:text-amber-300">
                Livre
              </span>
            )}
          </div>
          {icon && (
            <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs ${badgeTones[tone]}`}>
              {icon}
            </span>
          )}
        </div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">
          {value}
        </div>
        {sub && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
      </div>

      {action && <div className="mt-3 border-t border-slate-100/80 pt-2 dark:border-slate-800/80">{action}</div>}
    </div>
  );
}

export default function CashSummary({
  summary,
  reserveMetrics,
  month,
  nextMonth,
  isClosed,
  closedData,
  onPayOverdue,
  onOpenTransferModal,
  onCloseMonth,
  onReopenMonth,
}) {
  const s = summary;
  const pct = s.saidas > 0 ? Math.round((s.pagas / s.saidas) * 100) : 0;
  const deficit = s.sobra < 0;
  const isAllPaid = s.aPagar <= 0;

  // Cálculo de percentuais por categoria
  const fixoPct = s.saidas > 0 ? Math.round(((s.porCategoria.fixo || 0) / s.saidas) * 100) : 0;
  const varPct = s.saidas > 0 ? Math.round(((s.porCategoria.variavel || 0) / s.saidas) * 100) : 0;
  const divPct = s.saidas > 0 ? Math.round(((s.porCategoria.divida || 0) / s.saidas) * 100) : 0;

  const netToReserve = s.netToReserve || 0;

  // Termômetro da Reserva: Marcos (1 mês, 3 meses, 6 meses)
  const covered = reserveMetrics ? reserveMetrics.monthsCovered : 0;
  const target1Month = reserveMetrics ? reserveMetrics.monthlyFixed : 0;
  const target3Months = reserveMetrics ? reserveMetrics.monthlyFixed * 3 : 0;
  const target6Months = reserveMetrics ? reserveMetrics.target6Months : 0;

  let safetyTier = {
    badge: "🚨 Em Formação",
    desc: "Iniciando a cobertura dos gastos fixos essenciais.",
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50",
  };
  if (covered >= 6) {
    safetyTier = {
      badge: "🛡️ Blindado (6+ meses)",
      desc: "Excelente! Sua reserva cobre mais de 6 meses de contas fixas.",
      color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    };
  } else if (covered >= 3) {
    safetyTier = {
      badge: "🥈 Confortável (3 a 6 meses)",
      desc: "Bom nível de proteção para imprevistos e emergências.",
      color: "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
    };
  } else if (covered >= 1) {
    safetyTier = {
      badge: "🥉 Básico (1 a 3 meses)",
      desc: "Garante o sustento imediato do próximo mês.",
      color: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800",
    };
  }

  return (
    <section className="space-y-4">
      {/* Banner de Mês Fechado */}
      {isClosed && closedData && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/85 px-4 py-3 shadow-xs backdrop-blur-sm dark:border-emerald-800 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-base dark:bg-emerald-900/60">
              🔒
            </span>
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Mês {month ? monthLabel(month) : ""} Fechado!
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {closedData.caixaLivre > 0
                  ? `${brl(closedData.caixaLivre)} de caixa livre carregado para ${nextMonth ? monthLabel(nextMonth) : "o próximo mês"}.`
                  : `Sobra ${brl(closedData.sobra)} — sem caixa livre adicional neste período.`}
              </p>
            </div>
          </div>
          {onReopenMonth && (
            <button
              type="button"
              onClick={onReopenMonth}
              className="rounded-xl border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900/60 transition-colors shadow-2xs"
            >
              Reabrir mês ↩
            </button>
          )}
        </div>
      )}

      {/* Aviso: todas as despesas pagas, pronto para fechar */}
      {!isClosed && isAllPaid && s.saidas > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/85 px-4 py-3 shadow-xs backdrop-blur-sm dark:border-teal-800 dark:bg-teal-950/40">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-base dark:bg-teal-900/60">
              🎉
            </span>
            <div>
              <p className="text-sm font-bold text-teal-800 dark:text-teal-300">
                Todas as despesas deste mês estão pagas!
              </p>
              <p className="text-xs text-teal-700 dark:text-teal-400">
                {s.caixa > 0
                  ? `${brl(s.caixa)} de caixa livre serão transferidos para ${nextMonth ? monthLabel(nextMonth) : "o próximo mês"}.`
                  : "Feche o mês para confirmar o balanço e levar o saldo em frente."}
              </p>
            </div>
          </div>
          {onCloseMonth && (
            <button
              type="button"
              onClick={onCloseMonth}
              className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 transition-colors shadow-xs"
            >
              🔒 Fechar Mês Agora
            </button>
          )}
        </div>
      )}

      {/* 5 Cards de Métricas do Mês (KPIs) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card
          label="Entradas"
          value={brl(s.entradas)}
          tone="green"
          icon="↓"
          sub="Salário + adicionais"
        />
        <Card
          label="Saídas"
          value={brl(s.saidas)}
          tone="slate"
          icon="↑"
          sub={`Pagas ${brl(s.pagas)} · A pagar ${brl(s.aPagar)}`}
        />
        <Card
          label="Sobra do mês"
          value={brl(s.sobra)}
          tone={deficit ? "red" : "slate"}
          icon="="
          sub={deficit ? "⚠️ Déficit no mês" : "Entradas − Saídas"}
        />

        {/* Card Reserva */}
        <Card
          label="Reserva (50%)"
          value={brl(s.reserva)}
          tone="indigo"
          icon="🛡️"
          sub={
            netToReserve !== 0 ? (
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                {netToReserve > 0 ? `+ ${brl(netToReserve)} aportado` : `− ${brl(-netToReserve)} resgatado`}
              </span>
            ) : deficit ? (
              "Sem reserva (déficit)"
            ) : (
              "Metade da sobra para reserva"
            )
          }
          action={
            onOpenTransferModal && (
              <button
                type="button"
                onClick={onOpenTransferModal}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg py-0.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100/60 dark:text-indigo-400 dark:hover:bg-indigo-900/40 transition-colors"
              >
                <span>⇄</span>
                <span>Movimentar</span>
              </button>
            )
          }
        />

        {/* Card Caixa Livre (North Star com Destaque) */}
        <Card
          label="Caixa Livre (50%)"
          value={brl(s.caixa)}
          tone={deficit ? "red" : "amber"}
          highlight={!deficit && s.caixa > 0}
          icon="💳"
          sub={
            netToReserve !== 0 ? (
              <span className="font-semibold text-amber-700 dark:text-amber-300">
                {netToReserve > 0 ? `− ${brl(netToReserve)} para reserva` : `+ ${brl(-netToReserve)} da reserva`}
              </span>
            ) : deficit ? (
              "Déficit integral do mês"
            ) : (
              "Disponível para gastar"
            )
          }
          action={
            onOpenTransferModal && (
              <button
                type="button"
                onClick={onOpenTransferModal}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg py-0.5 text-[11px] font-bold text-amber-600 hover:bg-amber-100/60 dark:text-amber-400 dark:hover:bg-amber-900/40 transition-colors"
              >
                <span>⇄</span>
                <span>Transferir</span>
              </button>
            )
          }
        />
      </div>

      {/* Painel com Termômetro da Reserva em Marcos e Progresso de Pagamentos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contas Pagas e Distribuição por Categoria */}
        <div className="card-hover rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Contas pagas neste mês ({pct}%)
            </span>
            {onPayOverdue && s.aPagar > 0 && (
              <button
                type="button"
                onClick={onPayOverdue}
                className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
              >
                Pagar contas até hoje ⚡
              </button>
            )}
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>

          {/* Distribuição por Categoria */}
          <div className="mt-3.5">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Distribuição das Saídas</span>
              <span>Total: {brl(s.saidas)}</span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                title={`Fixos: ${brl(s.porCategoria.fixo)} (${fixoPct}%)`}
                className="bg-indigo-500 transition-all"
                style={{ width: `${fixoPct}%` }}
              />
              <div
                title={`Variáveis: ${brl(s.porCategoria.variavel)} (${varPct}%)`}
                className="bg-amber-400 transition-all"
                style={{ width: `${varPct}%` }}
              />
              <div
                title={`Dívidas: ${brl(s.porCategoria.divida)} (${divPct}%)`}
                className="bg-rose-500 transition-all"
                style={{ width: `${divPct}%` }}
              />
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 px-2 py-1 text-slate-700 dark:bg-indigo-950/30 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Fixos: <strong>{brl(s.porCategoria.fixo)}</strong> ({fixoPct}%)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50/80 px-2 py-1 text-slate-700 dark:bg-amber-950/30 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Variáveis: <strong>{brl(s.porCategoria.variavel)}</strong> ({varPct}%)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50/80 px-2 py-1 text-slate-700 dark:bg-rose-950/30 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Dívidas: <strong>{brl(s.porCategoria.divida)}</strong> ({divPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Termômetro da Reserva de Emergência Acumulada em Marcos */}
        <div className="card-hover rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-xs backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              🛡️ Termômetro da Reserva de Emergência
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${safetyTier.color}`}>
              {safetyTier.badge}
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Acumulado: <strong className="text-slate-900 dark:text-white">{reserveMetrics ? brl(reserveMetrics.accumulatedReserve) : "R$ 0,00"}</strong>
            </span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
              {covered.toFixed(1)} meses cobertos
            </span>
          </div>

          {/* Barra de Progresso com Gradiente */}
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${reserveMetrics ? reserveMetrics.progressPct : 0}%` }}
            />
          </div>

          {/* Marcos Visuais: 1 Mês, 3 Meses, 6 Meses */}
          <div className="mt-3 grid grid-cols-3 gap-1.5 pt-1 text-center">
            <div className={`rounded-xl border p-1.5 text-[11px] ${covered >= 1 ? "border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-slate-200/60 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400"}`}>
              <div className="font-bold">{covered >= 1 ? "✓ 1 Mês" : "1 Mês"}</div>
              <div className="text-[10px] tabular-nums opacity-80">{brl(target1Month)}</div>
            </div>
            <div className={`rounded-xl border p-1.5 text-[11px] ${covered >= 3 ? "border-indigo-200 bg-indigo-50/70 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300" : "border-slate-200/60 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400"}`}>
              <div className="font-bold">{covered >= 3 ? "✓ 3 Meses" : "3 Meses"}</div>
              <div className="text-[10px] tabular-nums opacity-80">{brl(target3Months)}</div>
            </div>
            <div className={`rounded-xl border p-1.5 text-[11px] ${covered >= 6 ? "border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300" : "border-amber-200 bg-amber-50/60 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"}`}>
              <div className="font-bold">{covered >= 6 ? "🏆 6 Meses" : "Meta 6M"}</div>
              <div className="text-[10px] tabular-nums opacity-80">{brl(target6Months)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
