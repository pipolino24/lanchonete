import { Users, ShoppingBag, TrendingUp, UserPlus, Gift } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Card, StatCard } from "@/components/admin/ui";
import { ClientesTabs, type ClienteRow } from "@/components/admin/clientes/ClientesTabs";
import { ExportButton, type ExportCustomer } from "@/components/admin/clientes/ExportButton";
import { criarCliente } from "./actions";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const session = await requireSession();
  const storeId = session.storeId;

  const last7 = new Date();
  last7.setDate(last7.getDate() - 7);

  const [totalCustomers, newCustomers, totalOrders, avgAgg, customers] = await Promise.all([
    prisma.customer.count({ where: { storeId } }),
    prisma.customer.count({ where: { storeId, createdAt: { gte: last7 } } }),
    prisma.order.count({ where: { storeId } }),
    prisma.order.aggregate({
      where: { storeId, status: { not: "CANCELED" } },
      _avg: { total: true },
    }),
    prisma.customer.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
  ]);

  const ticket = Math.round(avgAgg._avg.total ?? 0);

  // Normaliza para datas serializáveis (ISO) e calcula o último pedido.
  const rows: ClienteRow[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    createdAt: c.createdAt.toISOString(),
    ordersCount: c._count.orders,
    lastOrderAt: c.orders[0]?.createdAt.toISOString() ?? null,
  }));

  const exportRows: ExportCustomer[] = rows.map((c) => ({
    name: c.name,
    phone: c.phone,
    ordersCount: c.ordersCount,
    createdAt: c.createdAt,
  }));

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Base de clientes da sua loja"
        actions={<ExportButton customers={exportRows} />}
      />

      {/* Configuração de Cashback (recurso futuro) */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ember-500/15 text-ember-400">
              <Gift size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-cream">Cashback</h2>
                <Badge tone="warning">Em breve</Badge>
              </div>
              <p className="mt-0.5 max-w-md text-sm text-ash">
                Recompense seus clientes com uma porcentagem de volta em cada pedido. Em breve
                você poderá ativar e configurar o cashback por aqui.
              </p>
            </div>
          </div>

          <div className="flex items-end gap-3 opacity-50">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ash">% de cashback</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                disabled
                aria-label="Percentual de cashback"
                className="w-24 cursor-not-allowed rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
              />
            </label>
            <Button type="button" variant="secondary" disabled>
              Ativar
            </Button>
          </div>
        </div>
      </Card>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de clientes"
          value={String(totalCustomers)}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Pedidos"
          value={String(totalOrders)}
          icon={<ShoppingBag size={18} />}
        />
        <StatCard
          label="Ticket médio"
          value={formatPrice(ticket)}
          hint="Pedidos não cancelados"
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Novos (7 dias)"
          value={String(newCustomers)}
          icon={<UserPlus size={18} />}
        />
      </div>

      {/* Novo cliente */}
      <Card className="mt-4">
        <h2 className="mb-3 font-semibold text-cream">Novo cliente</h2>
        <form action={criarCliente} className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[12rem] flex-1">
            <span className="mb-1 block text-xs font-medium text-ash">Nome</span>
            <input
              name="name"
              required
              placeholder="Nome do cliente"
              className="w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
            />
          </label>
          <label className="block min-w-[12rem] flex-1">
            <span className="mb-1 block text-xs font-medium text-ash">Telefone</span>
            <input
              name="phone"
              required
              inputMode="tel"
              placeholder="(88) 90000-0000"
              className="w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
            />
          </label>
          <Button type="submit">
            <UserPlus size={16} />
            Adicionar
          </Button>
        </form>
      </Card>

      {/* Filtros + Lista */}
      <Card className="mt-4">
        <ClientesTabs customers={rows} />
      </Card>
    </>
  );
}
