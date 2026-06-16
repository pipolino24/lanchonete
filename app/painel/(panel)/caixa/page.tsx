import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Coins,
  Lock,
  TrendingUp,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Card, StatCard, EmptyState } from "@/components/admin/ui";
import { abrirCaixa, registrarEntrada, registrarSaida, fecharCaixa } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none";

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const MOVEMENT_LABEL: Record<string, string> = {
  IN: "Entrada",
  OUT: "Saída",
  SALE: "Venda",
};

export default async function CaixaPage() {
  const session = await requireSession();
  const storeId = session.storeId;

  const register = await prisma.cashRegister.findFirst({
    where: { storeId, status: "OPEN" },
    orderBy: { openedAt: "desc" },
    include: { movements: { orderBy: { createdAt: "desc" } } },
  });

  // ───────────────────────── Caixa fechado ─────────────────────────
  if (!register) {
    return (
      <>
        <PageHeader
          title="Caixa"
          subtitle="Controle de entradas, saídas e fechamento"
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EmptyState
              icon={<Lock size={40} />}
              title="Caixa fechado"
              description="Não há nenhum caixa aberto no momento. Abra o caixa informando o saldo inicial para começar a registrar movimentações."
            />
          </div>

          <Card>
            <h2 className="mb-1 flex items-center gap-2 font-semibold text-cream">
              <Wallet size={18} className="text-ember-400" /> Abrir caixa
            </h2>
            <p className="mb-4 text-sm text-ash">Informe o saldo de abertura (troco inicial).</p>

            <form action={abrirCaixa} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ash">Saldo de abertura</span>
                <input
                  name="openingBalance"
                  inputMode="decimal"
                  placeholder="0,00"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ash">Observação (opcional)</span>
                <input
                  name="note"
                  placeholder="Ex.: caixa do turno da tarde"
                  className={inputClass}
                />
              </label>
              <Button type="submit" className="w-full">
                Abrir caixa
              </Button>
            </form>
          </Card>
        </div>
      </>
    );
  }

  // ───────────────────────── Caixa aberto ──────────────────────────
  const totalEntradas = register.movements
    .filter((m) => m.type === "IN")
    .reduce((s, m) => s + m.amount, 0);

  const totalSaidas = register.movements
    .filter((m) => m.type === "OUT")
    .reduce((s, m) => s + m.amount, 0);

  // Vendas em dinheiro: pedidos pagos em CASH, não cancelados, criados após a abertura.
  const cashOrders = await prisma.order.findMany({
    where: {
      storeId,
      paymentMethod: "CASH",
      status: { not: "CANCELED" },
      createdAt: { gte: register.openedAt },
    },
    select: { total: true },
  });
  const vendasDinheiro = cashOrders.reduce((s, o) => s + o.total, 0);

  const esperado =
    register.openingBalance + totalEntradas + vendasDinheiro - totalSaidas;

  return (
    <>
      <PageHeader
        title="Caixa"
        subtitle="Controle de entradas, saídas e fechamento"
        actions={
          <Badge tone="success">
            Caixa aberto · {dateTimeFmt.format(register.openedAt)}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Saldo de abertura"
          value={formatPrice(register.openingBalance)}
          icon={<Wallet size={18} />}
        />
        <StatCard
          label="Total de entradas"
          value={formatPrice(totalEntradas)}
          icon={<ArrowDownCircle size={18} />}
        />
        <StatCard
          label="Total de saídas"
          value={formatPrice(totalSaidas)}
          icon={<ArrowUpCircle size={18} />}
        />
        <StatCard
          label="Vendas em dinheiro"
          value={formatPrice(vendasDinheiro)}
          icon={<Banknote size={18} />}
          hint={`${cashOrders.length} pedido(s) em dinheiro`}
        />
        <StatCard
          label="Em caixa (esperado)"
          value={formatPrice(esperado)}
          icon={<TrendingUp size={18} />}
          hint="Abertura + entradas + vendas − saídas"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Histórico de movimentações */}
        <Card className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-cream">
            <Coins size={18} className="text-ember-400" /> Movimentações
          </h2>

          {register.movements.length === 0 ? (
            <p className="py-8 text-center text-sm text-ash">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="divide-y divide-coal-800">
              {register.movements.map((m) => {
                const tone =
                  m.type === "OUT" ? "danger" : m.type === "SALE" ? "info" : "success";
                const sign = m.type === "OUT" ? "−" : "+";
                const amountColor = m.type === "OUT" ? "text-danger" : "text-success";
                return (
                  <div key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone={tone}>{MOVEMENT_LABEL[m.type] ?? m.type}</Badge>
                        <span className="truncate text-sm text-cream">
                          {m.description ?? "—"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ash-dark">
                        {timeFmt.format(m.createdAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 font-semibold ${amountColor}`}>
                      {sign} {formatPrice(m.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Formulários de movimentação e fechamento */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-cream">
              <ArrowDownCircle size={18} className="text-success" /> Registrar entrada
            </h2>
            <form action={registrarEntrada} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ash">Valor</span>
                <input
                  name="amount"
                  inputMode="decimal"
                  placeholder="0,00"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ash">Descrição</span>
                <input
                  name="description"
                  placeholder="Ex.: reforço de troco"
                  className={inputClass}
                />
              </label>
              <Button type="submit" variant="secondary" size="sm" className="w-full">
                Registrar entrada
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-cream">
              <ArrowUpCircle size={18} className="text-danger" /> Registrar saída
            </h2>
            <form action={registrarSaida} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ash">Valor</span>
                <input
                  name="amount"
                  inputMode="decimal"
                  placeholder="0,00"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ash">Descrição</span>
                <input
                  name="description"
                  placeholder="Ex.: pagamento de fornecedor"
                  className={inputClass}
                />
              </label>
              <Button type="submit" variant="secondary" size="sm" className="w-full">
                Registrar saída
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-1 flex items-center gap-2 font-semibold text-cream">
              <Lock size={18} className="text-ember-400" /> Fechar caixa
            </h2>
            <p className="mb-3 text-sm text-ash">
              Esperado em caixa:{" "}
              <span className="font-semibold text-cream">{formatPrice(esperado)}</span>
            </p>
            <form action={fecharCaixa} className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ash">Valor contado</span>
                <input
                  name="countedBalance"
                  inputMode="decimal"
                  placeholder="0,00"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ash">Observação (opcional)</span>
                <input
                  name="note"
                  placeholder="Ex.: divergência no troco"
                  className={inputClass}
                />
              </label>
              <Button type="submit" variant="danger" size="sm" className="w-full">
                Fechar caixa
              </Button>
              <p className="text-xs text-ash-dark">
                A diferença (contado − esperado) é calculada no fechamento.
              </p>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
