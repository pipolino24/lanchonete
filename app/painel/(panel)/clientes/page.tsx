import Link from "next/link";
import { Users, ShoppingBag, TrendingUp, UserPlus, Phone, Trash2, Gift } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Card, StatCard, EmptyState } from "@/components/admin/ui";
import { criarCliente, excluirCliente } from "./actions";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const session = await requireSession();
  const storeId = session.storeId;

  const { filtro } = await searchParams;
  const onlyNew = filtro === "novos";

  const last7 = new Date();
  last7.setDate(last7.getDate() - 7);

  const [
    totalCustomers,
    newCustomers,
    totalOrders,
    avgAgg,
    customers,
  ] = await Promise.all([
    prisma.customer.count({ where: { storeId } }),
    prisma.customer.count({ where: { storeId, createdAt: { gte: last7 } } }),
    prisma.order.count({ where: { storeId } }),
    prisma.order.aggregate({
      where: { storeId, status: { not: "CANCELED" } },
      _avg: { total: true },
    }),
    prisma.customer.findMany({
      where: {
        storeId,
        ...(onlyNew ? { createdAt: { gte: last7 } } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ]);

  const ticket = Math.round(avgAgg._avg.total ?? 0);

  const tabs = [
    { key: "todos", label: "Todos", href: "/painel/clientes" },
    { key: "novos", label: "Novos (7 dias)", href: "/painel/clientes?filtro=novos" },
  ];
  const activeKey = onlyNew ? "novos" : "todos";

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Base de clientes da sua loja"
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
        <div className="mb-4 flex items-center gap-2">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                activeKey === t.key
                  ? "bg-ember-500/15 text-ember-400 ring-1 ring-ember-500/25"
                  : "text-ash hover:bg-coal-800 hover:text-cream",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {customers.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={onlyNew ? "Nenhum cliente novo" : "Nenhum cliente ainda"}
            description={
              onlyNew
                ? "Nenhum cadastro nos últimos 7 dias."
                : "Cadastre seu primeiro cliente usando o formulário acima."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-coal-800 text-left text-xs font-medium uppercase tracking-wide text-ash-dark">
                  <th className="px-3 py-2.5 font-medium">Cliente</th>
                  <th className="px-3 py-2.5 font-medium">Telefone</th>
                  <th className="px-3 py-2.5 text-center font-medium">Pedidos</th>
                  <th className="px-3 py-2.5 font-medium">Cadastro</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-coal-800">
                {customers.map((c) => {
                  const isNew = c.createdAt >= last7;
                  return (
                    <tr key={c.id} className="text-cream">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          {isNew && <Badge tone="success">Novo</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-ash">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone size={14} className="text-ash-dark" />
                          {c.phone}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge tone={c._count.orders > 0 ? "ember" : "neutral"}>
                          {c._count.orders}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-ash">{dateFmt.format(c.createdAt)}</td>
                      <td className="px-3 py-3 text-right">
                        <form action={excluirCliente.bind(null, c.id)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            aria-label={`Excluir ${c.name}`}
                            title="Excluir cliente"
                            className="text-ash-dark hover:text-danger"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
