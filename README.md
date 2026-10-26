# Financeiro Pessoal

Sistema de planejamento financeiro pessoal com **cenários (Plano A, B, C…)**, feito em Next.js (App Router) + Tailwind CSS.
Os dados ficam em arquivos `.json` locais (`data/planA.json`, `data/planB.json`, …), lidos e gravados por rotas de API do Next.js via `fs`.

## Como rodar

Requisitos: Node.js 18.17+ (testado no Node 22).

```bash
npm install
npm run dev        # http://localhost:3000
```

Produção local: `npm run build && npm start`.

Os arquivos `data/planA.json`, `planB.json` e `planC.json` vêm configurados como modelos limpos prontos para preenchimento.

## O que o sistema faz

- **Abas de planos** (A, B, C) + botão **Criar Novo Plano** (em branco ou copiando outro plano). Cada plano = um arquivo JSON.
  Planos criados por você podem ser excluídos (×); A, B e C são protegidos.
- **Salário**: configure salário bruto e líquido no topo para cálculo automático de estimativas.
- **Entradas** por data; adicione receitas avulsas ou recorrentes no mês selecionado.
- **Saídas** em **Fixos / Variáveis / Dívidas**, cada uma com dia de vencimento e checkbox **Pago**.
- **Gastos variáveis**: formulário com descrição, valor, data de pagamento e "Já pago".
- **Resumo do mês**: Sobra = Entradas − Saídas · Reserva = 50% da sobra · Caixa livre = 50% da sobra.
- **Fluxo de caixa dia a dia**: cruza dias de recebimento com dias de vencimento, desenha o gráfico de saldo e emite alertas (🚨 saldo insuficiente / ⚠️ margem apertada < R$ 100).
- **Editar valores**: clique em qualquer valor para editar ("Só este mês" ou "Este e próximos").
- **13º salário**: estimativas de parcelas em novembro e dezembro com botão "Gerar / recalcular 13º".
- **Visão geral** de todos os meses para comparar sobra, reserva e caixa.

## Estrutura

```
app/
  page.jsx, layout.jsx, globals.css
  api/plans/route.js          GET lista · POST cria plano
  api/plans/[id]/route.js     GET lê · PUT salva · DELETE exclui
components/
  Dashboard.jsx               estado, salvamento automático, composição da tela
  PlanTabs.jsx                abas + criar plano
  CashSummary.jsx             entradas / saídas / sobra / reserva / caixa
  CashflowTimeline.jsx        alertas + gráfico + tabela do saldo diário
  IncomeList.jsx, ExpenseList.jsx, AmountCell.jsx, YearOverview.jsx
lib/
  finance.mjs                 TODA a lógica de cálculo e simulação (pura, sem fs)
  seed.mjs                    dados iniciais dos planos
  storage.mjs                 leitura/escrita atômica dos JSON (fs)
scripts/gen-seed.mjs          `npm run seed`
data/                         planA.json, planB.json, planC.json
```

## Premissas e Configurações

- **Saldo inicial**: configure o seu saldo real em "Saldo em conta no início do plano".
- **Salvamento automático**: ~0,35 s após cada alteração; o status aparece no topo da página.
