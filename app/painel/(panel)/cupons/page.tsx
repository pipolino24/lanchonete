import { Ticket, Trash2, Truck } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { CupomForm } from "@/components/admin/cupons/CupomForm";
import { excluirCupom, alternarCupom } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(d: Date | null) {
  if (!d) return null;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function validade(startsAt: Date | null, endsAt: Date | null) {
  const ini = formatDate(startsAt);
  const fim = formatDate(endsAt);
  if (!ini && !fim) return "Sem prazo";
  if (ini && fim) return `${ini} ate ${fim}`;
  if (fim) return `Ate ${fim}`;
  return `A partir de ${ini}`;
}

export default async function CuponsPage() {
  const session = await requireSession();

  const cupons = await prisma.coupon.findMany({
    where: { storeId: session.storeId },
    orderBy: [{ active: "desc" }, { code: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Cupons"
        subtitle="Crie e gerencie cupons de desconto da loja."
        actions={<CupomForm />}
      />

      {cupons.length === 0 ? (
        <EmptyState
          icon={<Ticket className="h-10 w-10" />}
          title="Nenhum cupom cadastrado"
          description="Crie seu primeiro cupom para oferecer descontos aos clientes."
          action={<CupomForm />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cupons.map((c) => {
            const valor =
              c.discountType === "PERCENT"
                ? `${c.discountValue}%`
                : formatPrice(c.discountValue);

            return (
              <Card key={c.id} className={c.active ? "" : "opacity-60"}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-bold tracking-wide text-cream">
                        {c.code}
                      </span>
                      <Badge tone={c.active ? "success" : "neutral"}>
                        {c.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-ash">
                      {c.discountType === "PERCENT"
                        ? "Desconto percentual"
                        : "Desconto em valor"}
                    </p>
                  </div>
                  <span className="font-display text-2xl font-bold text-ember-400">
                    {valor}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ash">Pedido mínimo</span>
                    <span className="text-cream">
                      {c.minOrder != null ? formatPrice(c.minOrder) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ash">Frete grátis</span>
                    <span
                      className={
                        c.freeShipping ? "text-success" : "text-ash-dark"
                      }
                    >
                      {c.freeShipping ? (
                        <span className="inline-flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5" />
                          Sim
                        </span>
                      ) : (
                        "Não"
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ash">Usos</span>
                    <span className="text-cream">
                      {c.usedCount}
                      {c.totalLimit != null ? ` / ${c.totalLimit}` : ""}
                    </span>
                  </div>
                  {c.perCustomerLimit != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-ash">Limite por cliente</span>
                      <span className="text-cream">{c.perCustomerLimit}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-ash">Validade</span>
                    <span className="text-cream">
                      {validade(c.startsAt, c.endsAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-coal-800 pt-3">
                  <form action={alternarCupom.bind(null, c.id)}>
                    <Button type="submit" variant="secondary" size="sm">
                      {c.active ? "Desativar" : "Ativar"}
                    </Button>
                  </form>
                  <form action={excluirCupom.bind(null, c.id)} className="ml-auto">
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
