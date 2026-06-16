import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, Clock, MapPin, ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { Emblem } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STEPS = [
  { key: "NEW", label: "Recebido" },
  { key: "PREPARING", label: "Em preparo" },
  { key: "DELIVERING", label: "A caminho" },
  { key: "COMPLETED", label: "Concluído" },
];

const PAYMENT_LABEL: Record<string, string> = {
  PIX: "Pix", CASH: "Dinheiro", CREDIT: "Crédito", DEBIT: "Débito",
  MEAL_VOUCHER: "Vale Refeição", FOOD_VOUCHER: "Vale Alimentação",
};

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) notFound();

  const order = await prisma.order.findFirst({
    where: { storeId: store.id, code: decodeURIComponent(code) },
    include: { items: { include: { complements: true } } },
  });
  if (!order) notFound();

  const canceled = order.status === "CANCELED";
  const currentIdx = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-6">
      <Link href={`/cardapio/${slug}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-ash hover:text-cream">
        <ChevronLeft size={16} /> Voltar ao cardápio
      </Link>

      <div className="surface rounded-2xl p-5 shadow-warm">
        <div className="flex items-center gap-3">
          <Emblem size="md" />
          <div className="flex-1">
            <p className="text-xs text-ash-dark">Pedido</p>
            <h1 className="font-display text-2xl font-bold text-cream">#{order.code}</h1>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold ring-1",
              canceled
                ? "bg-danger/15 text-danger ring-danger/25"
                : order.status === "COMPLETED"
                  ? "bg-success/15 text-success ring-success/25"
                  : "bg-ember-500/15 text-ember-400 ring-ember-500/25",
            )}
          >
            {canceled ? "Cancelado" : STEPS[currentIdx]?.label ?? "Recebido"}
          </span>
        </div>

        {/* Timeline */}
        {!canceled && (
          <div className="mt-6 flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full text-xs font-bold",
                      i <= currentIdx ? "bg-ember-500 text-white" : "bg-coal-800 text-ash-dark",
                    )}
                  >
                    {i < currentIdx ? <Check size={15} /> : i + 1}
                  </div>
                  <span className={cn("mt-1 text-center text-[10px]", i <= currentIdx ? "text-cream" : "text-ash-dark")}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("mx-1 h-0.5 flex-1 rounded", i < currentIdx ? "bg-ember-500" : "bg-coal-800")} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Itens */}
      <div className="surface mt-4 rounded-2xl p-5 shadow-warm">
        <h2 className="mb-3 font-semibold text-cream">Itens</h2>
        <div className="space-y-3">
          {order.items.map((it) => (
            <div key={it.id}>
              <div className="flex justify-between text-sm">
                <span className="text-cream">{it.quantity}× {it.name}</span>
                <span className="text-ash">{formatPrice(it.totalPrice)}</span>
              </div>
              {it.complements.map((c) => (
                <p key={c.id} className="text-xs text-ash">+ {c.quantity}× {c.name}</p>
              ))}
              {it.note && <p className="text-xs italic text-ash-dark">“{it.note}”</p>}
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 border-t border-coal-700 pt-3 text-sm">
          <div className="flex justify-between text-ash"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.deliveryFee > 0 && <div className="flex justify-between text-ash"><span>Entrega</span><span>{formatPrice(order.deliveryFee)}</span></div>}
          {order.discount > 0 && <div className="flex justify-between text-success"><span>Desconto</span><span>− {formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between pt-1 text-base font-bold text-cream"><span>Total</span><span>{formatPrice(order.total)}</span></div>
        </div>

        {order.paymentMethod && (
          <p className="mt-3 text-sm text-ash">
            Pagamento: <span className="text-cream">{PAYMENT_LABEL[order.paymentMethod]}</span>
            {order.paymentMethod === "CASH" && order.changeFor ? ` · troco p/ ${formatPrice(order.changeFor)}` : ""}
          </p>
        )}
      </div>

      {/* Entrega */}
      {order.addressSnapshot && (
        <div className="surface mt-4 rounded-2xl p-5 shadow-warm">
          <h2 className="mb-2 font-semibold text-cream">Entrega</h2>
          <p className="text-sm text-cream">{order.customerName}</p>
          {order.customerPhone && (
            <p className="flex items-center gap-1.5 text-sm text-ash">
              <Clock size={13} /> {order.customerPhone}
            </p>
          )}
          <p className="mt-1 flex items-start gap-1.5 text-sm text-ash">
            <MapPin size={14} className="mt-0.5 shrink-0" /> {order.addressSnapshot}
          </p>
        </div>
      )}
    </div>
  );
}
