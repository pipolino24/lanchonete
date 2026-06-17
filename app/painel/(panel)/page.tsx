import { DollarSign, ClipboardList, Users, TrendingUp } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { startOfTodayBR, startOfDaysAgoBR } from "@/lib/tz";
import { PageHeader, StatCard, Card } from "@/components/admin/ui";
import { NumberTicker } from "@/components/ui/NumberTicker";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const storeId = session.storeId;

  // Limites no fuso de Brasília (não no UTC do servidor)
  const today = startOfTodayBR();
  const last7 = startOfDaysAgoBR(7);

  const [todayOrders, totalCustomers, last7Orders, recentOrders] = await Promise.all([
    prisma.order.findMany({
      where: { storeId, status: { not: "CANCELED" }, createdAt: { gte: today } },
      select: { total: true },
    }),
    prisma.customer.count({ where: { storeId } }),
    prisma.order.findMany({
      where: { storeId, status: { not: "CANCELED" }, createdAt: { gte: last7 } },
      select: { total: true },
    }),
    prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, code: true, customerName: true, total: true, status: true, type: true },
    }),
  ]);

  const faturamento = todayOrders.reduce((s, o) => s + o.total, 0);
  const last7Total = last7Orders.reduce((s, o) => s + o.total, 0);
  const ticket = todayOrders.length ? Math.round(faturamento / todayOrders.length) : 0;

  const statusLabel: Record<string, string> = {
    NEW: "Novo",
    PREPARING: "Em preparo",
    DELIVERING: "Saiu p/ entrega",
    COMPLETED: "Concluído",
    CANCELED: "Cancelado",
  };
  const typeLabel: Record<string, string> = { DELIVERY: "Delivery", PICKUP: "Retirada", DINEIN: "Mesa" };

  return (
    <>
      <PageHeader title="Início" subtitle="Visão geral da sua operação hoje" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturamento hoje" value={<NumberTicker value={faturamento} format="currency" />} icon={<DollarSign size={18} />} />
        <StatCard label="Pedidos hoje" value={<NumberTicker value={todayOrders.length} />} icon={<ClipboardList size={18} />} />
        <StatCard label="Clientes" value={<NumberTicker value={totalCustomers} />} icon={<Users size={18} />} />
        <StatCard label="Ticket médio" value={<NumberTicker value={ticket} format="currency" />} icon={<TrendingUp size={18} />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-semibold text-cream">Pedidos recentes</h2>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-ash">Nenhum pedido ainda.</p>
          ) : (
            <div className="divide-y divide-coal-800">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-cream">
                      #{o.code} · {o.customerName ?? "Cliente"}
                    </p>
                    <p className="text-xs text-ash">
                      {typeLabel[o.type]} · {statusLabel[o.status]}
                    </p>
                  </div>
                  <span className="font-semibold text-ember-400">{formatPrice(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold text-cream">Últimos 7 dias</h2>
          <p className="text-sm text-ash">Receita acumulada</p>
          <p className="mt-4 font-display text-3xl font-bold text-cream">{formatPrice(last7Total)}</p>
          <p className="mt-1 text-xs text-ash-dark">{last7Orders.length} pedidos no período</p>
        </Card>
      </div>
    </>
  );
}
