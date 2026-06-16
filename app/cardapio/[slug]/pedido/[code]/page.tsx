import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, MapPin, ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { OrderTrackingParallaxCard } from "@/components/ui/order-tracking-parallax-card";

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

      <OrderTrackingParallaxCard
        code={order.code}
        steps={STEPS}
        currentIdx={currentIdx}
        canceled={canceled}
        etaMinutes={order.status === "COMPLETED" ? null : store.prepTime}
        destination={order.addressSnapshot}
      />

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
