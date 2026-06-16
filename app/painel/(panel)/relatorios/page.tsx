import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Truck,
  Bike,
  Store as StoreIcon,
  UtensilsCrossed,
  CreditCard,
  Trophy,
  User,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { PageHeader, Card, StatCard, EmptyState } from "@/components/admin/ui";
import { PrintButton } from "@/components/admin/relatorios/PrintButton";

export const dynamic = "force-dynamic";

type Periodo = "hoje" | "7dias" | "30dias";

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "7dias", label: "7 dias" },
  { key: "30dias", label: "30 dias" },
];

const PERIODO_SUBTITLE: Record<Periodo, string> = {
  hoje: "Desempenho de hoje",
  "7dias": "Desempenho dos últimos 7 dias",
  "30dias": "Desempenho dos últimos 30 dias",
};

function normalizePeriodo(value?: string): Periodo {
  if (value === "7dias" || value === "30dias") return value;
  return "hoje";
}

function gteForPeriodo(periodo: Periodo): Date {
  const gte = new Date();
  if (periodo === "hoje") {
    gte.setHours(0, 0, 0, 0);
  } else if (periodo === "7dias") {
    gte.setDate(gte.getDate() - 7);
  } else {
    gte.setDate(gte.getDate() - 30);
  }
  return gte;
}

const TYPE_LABEL: Record<string, string> = {
  DELIVERY: "Entrega",
  PICKUP: "Retirada",
  DINEIN: "Mesa",
};

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  CREDIT: "Crédito",
  DEBIT: "Débito",
  MEAL_VOUCHER: "Vale-refeição",
  FOOD_VOUCHER: "Vale-alimentação",
};

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const session = await requireSession();
  const storeId = session.storeId;

  const { periodo: periodoParam } = await searchParams;
  const periodo = normalizePeriodo(periodoParam);
  const gte = gteForPeriodo(periodo);

  const orders = await prisma.order.findMany({
    where: {
      storeId,
      status: { not: "CANCELED" },
      createdAt: { gte },
    },
    select: {
      type: true,
      status: true,
      paymentMethod: true,
      total: true,
      deliveryFee: true,
      driverId: true,
      items: { select: { name: true, quantity: true } },
    },
  });

  const drivers = await prisma.driver.findMany({
    where: { storeId },
    select: { id: true, name: true },
  });
  const driverNameById = new Map(drivers.map((d) => [d.id, d.name]));

  // Totais
  const faturamento = orders.reduce((s, o) => s + o.total, 0);
  const totalPedidos = orders.length;
  const ticketMedio = totalPedidos ? Math.round(faturamento / totalPedidos) : 0;
  const totalEntregas = orders.reduce((s, o) => s + o.deliveryFee, 0);

  // Vendas por canal (tipo de pedido)
  const canalAgg: Record<string, { qtd: number; receita: number }> = {
    DELIVERY: { qtd: 0, receita: 0 },
    PICKUP: { qtd: 0, receita: 0 },
    DINEIN: { qtd: 0, receita: 0 },
  };
  for (const o of orders) {
    const bucket = canalAgg[o.type] ?? (canalAgg[o.type] = { qtd: 0, receita: 0 });
    bucket.qtd += 1;
    bucket.receita += o.total;
  }
  const canalIcon: Record<string, React.ReactNode> = {
    DELIVERY: <Bike size={16} />,
    PICKUP: <StoreIcon size={16} />,
    DINEIN: <UtensilsCrossed size={16} />,
  };
  const canais = (["DELIVERY", "PICKUP", "DINEIN"] as const).map((key) => ({
    key,
    label: TYPE_LABEL[key],
    icon: canalIcon[key],
    qtd: canalAgg[key].qtd,
    receita: canalAgg[key].receita,
  }));

  // Por forma de pagamento
  const pagamentoAgg = new Map<string, { qtd: number; soma: number }>();
  for (const o of orders) {
    const key = o.paymentMethod ?? "—";
    const bucket = pagamentoAgg.get(key) ?? { qtd: 0, soma: 0 };
    bucket.qtd += 1;
    bucket.soma += o.total;
    pagamentoAgg.set(key, bucket);
  }
  const pagamentos = Array.from(pagamentoAgg.entries())
    .map(([key, v]) => ({
      key,
      label: key === "—" ? "Não informado" : PAYMENT_LABEL[key] ?? key,
      qtd: v.qtd,
      soma: v.soma,
    }))
    .sort((a, b) => b.soma - a.soma);

  // Itens mais vendidos (agrega por name, soma quantity), top 10
  const itensAgg = new Map<string, number>();
  for (const o of orders) {
    for (const it of o.items) {
      itensAgg.set(it.name, (itensAgg.get(it.name) ?? 0) + it.quantity);
    }
  }
  const topItens = Array.from(itensAgg.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
  const maxItemQtd = topItens.length ? topItens[0].quantity : 0;

  // Entregadores: pedidos COMPLETED/DELIVERING agrupados por driverId
  const SEM_ENTREGADOR = "__sem__";
  const entregadorAgg = new Map<string, { qtd: number; receita: number }>();
  for (const o of orders) {
    if (o.status !== "COMPLETED" && o.status !== "DELIVERING") continue;
    const key = o.driverId ?? SEM_ENTREGADOR;
    const bucket = entregadorAgg.get(key) ?? { qtd: 0, receita: 0 };
    bucket.qtd += 1;
    bucket.receita += o.total;
    entregadorAgg.set(key, bucket);
  }
  const entregadores = Array.from(entregadorAgg.entries())
    .map(([key, v]) => ({
      key,
      label:
        key === SEM_ENTREGADOR
          ? "Sem entregador"
          : driverNameById.get(key) ?? "Entregador removido",
      qtd: v.qtd,
      receita: v.receita,
    }))
    .sort((a, b) => b.qtd - a.qtd);

  const hasData = totalPedidos > 0;

  return (
    <>
      {/* Estilos de impressão — esconde a sidebar e ajusta o padding ao imprimir */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              aside { display: none !important; }
              .no-print { display: none !important; }
              main { padding: 0 !important; margin: 0 !important; }
              body { background: #ffffff !important; }
              @page { margin: 16mm; }
            }
          `,
        }}
      />

      <PageHeader
        title="Relatórios"
        subtitle={PERIODO_SUBTITLE[periodo]}
        actions={<PrintButton />}
      />

      {/* Tabs de período */}
      <div className="no-print mb-4 flex items-center gap-2">
        {PERIODOS.map((p) => (
          <Link
            key={p.key}
            href={`/painel/relatorios?periodo=${p.key}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              periodo === p.key
                ? "bg-ember-500/15 text-ember-400 ring-1 ring-ember-500/25"
                : "text-ash hover:bg-coal-800 hover:text-cream",
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Faturamento total"
          value={formatPrice(faturamento)}
          icon={<DollarSign size={18} />}
        />
        <StatCard
          label="Pedidos"
          value={String(totalPedidos)}
          icon={<ShoppingBag size={18} />}
        />
        <StatCard
          label="Ticket médio"
          value={formatPrice(ticketMedio)}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Taxas de entrega"
          value={formatPrice(totalEntregas)}
          icon={<Truck size={18} />}
        />
      </div>

      {!hasData ? (
        <Card className="mt-4">
          <EmptyState
            icon={<TrendingUp size={28} />}
            title="Sem dados no período"
            description="Nenhum pedido encontrado para o período selecionado. Assim que novos pedidos forem registrados, eles aparecerão aqui."
          />
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Vendas por canal */}
          <Card>
            <h2 className="mb-3 font-semibold text-cream">Vendas por canal</h2>
            <div className="divide-y divide-coal-800">
              {canais.map((c) => (
                <div key={c.key} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-ember-500/15 text-ember-400">
                      {c.icon}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-cream">{c.label}</p>
                      <p className="text-xs text-ash">
                        {c.qtd} {c.qtd === 1 ? "pedido" : "pedidos"}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-ember-400">
                    {formatPrice(c.receita)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Por forma de pagamento */}
          <Card>
            <h2 className="mb-3 font-semibold text-cream">Por forma de pagamento</h2>
            {pagamentos.length === 0 ? (
              <p className="py-8 text-center text-sm text-ash">
                Nenhuma forma de pagamento registrada.
              </p>
            ) : (
              <div className="divide-y divide-coal-800">
                {pagamentos.map((p) => (
                  <div key={p.key} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-coal-800 text-ash">
                        <CreditCard size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-cream">{p.label}</p>
                        <p className="text-xs text-ash">
                          {p.qtd} {p.qtd === 1 ? "pedido" : "pedidos"}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-cream">{formatPrice(p.soma)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Itens mais vendidos */}
          <Card className="lg:col-span-2">
            <h2 className="mb-3 font-semibold text-cream">Itens mais vendidos</h2>
            <div className="space-y-2.5">
              {topItens.map((it, idx) => (
                <div key={it.name} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold",
                      idx === 0
                        ? "bg-ember-500/20 text-ember-400"
                        : "bg-coal-800 text-ash",
                    )}
                  >
                    {idx === 0 ? <Trophy size={14} /> : idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-cream">{it.name}</p>
                      <span className="shrink-0 text-sm font-semibold text-ember-400">
                        {it.quantity}{" "}
                        <span className="text-xs font-normal text-ash">
                          {it.quantity === 1 ? "un." : "un."}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-coal-800">
                      <div
                        className="h-full rounded-full bg-ember-500"
                        style={{
                          width: `${maxItemQtd ? (it.quantity / maxItemQtd) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Entregadores */}
          <Card className="lg:col-span-2">
            <h2 className="mb-3 font-semibold text-cream">Entregadores</h2>
            {entregadores.length === 0 ? (
              <p className="py-8 text-center text-sm text-ash">
                Nenhuma entrega concluída ou em rota no período.
              </p>
            ) : (
              <div className="divide-y divide-coal-800">
                {entregadores.map((e) => (
                  <div key={e.key} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-xl",
                          e.key === "__sem__"
                            ? "bg-coal-800 text-ash"
                            : "bg-ember-500/15 text-ember-400",
                        )}
                      >
                        {e.key === "__sem__" ? <User size={16} /> : <Bike size={16} />}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-cream">{e.label}</p>
                        <p className="text-xs text-ash">
                          {e.qtd} {e.qtd === 1 ? "entrega" : "entregas"}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-ember-400">
                      {formatPrice(e.receita)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
