"use client";

import { ShoppingBag, Plus, Minus, Trash2, Bike, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/money";
import { useCart, cartSubtotal, lineTotal, type OrderType } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

export function CartPanel({
  minOrder,
  freeShippingAbove,
  deliveryFeePreview,
  onCheckout,
}: {
  minOrder: number;
  freeShippingAbove: number | null;
  deliveryFeePreview: number;
  onCheckout: () => void;
}) {
  const { items, orderType, setOrderType, updateQty, removeItem } = useCart();
  const subtotal = cartSubtotal(items);
  const deliveryFee =
    orderType !== "DELIVERY"
      ? 0
      : freeShippingAbove != null && subtotal >= freeShippingAbove
        ? 0
        : deliveryFeePreview;
  const total = subtotal + deliveryFee;
  const belowMin = subtotal < minOrder;

  const opts: { type: OrderType; label: string; icon: React.ReactNode }[] = [
    { type: "DELIVERY", label: "Delivery", icon: <Bike size={15} /> },
    { type: "PICKUP", label: "Retirada", icon: <Store size={15} /> },
  ];

  return (
    <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col rounded-2xl border border-coal-800 bg-coal-900/70">
      <div className="flex items-center gap-2 border-b border-coal-800 p-4">
        <ShoppingBag size={18} className="text-ember-400" />
        <h2 className="font-display text-lg font-bold text-cream">Sua sacola</h2>
      </div>

      {items.length === 0 ? (
        <div className="grid flex-1 place-items-center px-6 py-12 text-center">
          <div>
            <ShoppingBag size={36} className="mx-auto opacity-30" />
            <p className="mt-3 text-sm text-ash">Sua sacola está vazia.</p>
            <p className="mt-1 text-xs text-ash-dark">Escolha seus itens no cardápio ao lado.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="flex gap-2 rounded-xl bg-coal-850 p-1 ring-1 ring-coal-700">
              {opts.map((o) => (
                <button
                  key={o.type}
                  onClick={() => setOrderType(o.type)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
                    orderType === o.type ? "bg-ember-500 text-white" : "text-ash hover:text-cream",
                  )}
                >
                  {o.icon} {o.label}
                </button>
              ))}
            </div>

            {items.map((it) => (
              <div key={it.lineId} className="rounded-xl border border-coal-800 bg-coal-850 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-cream">{it.name}</p>
                  <button onClick={() => removeItem(it.lineId)} className="text-ash-dark hover:text-danger">
                    <Trash2 size={15} />
                  </button>
                </div>
                {it.complements.map((c) => (
                  <p key={c.itemId} className="text-xs text-ash">+ {c.quantity}× {c.name}</p>
                ))}
                {it.removedIngredients.map((r) => (
                  <p key={r} className="text-xs text-danger">− {r}</p>
                ))}
                {it.note && <p className="text-xs italic text-ash-dark">“{it.note}”</p>}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ember-400">{formatPrice(lineTotal(it))}</span>
                  <div className="inline-flex items-center rounded-lg bg-coal-800 ring-1 ring-coal-700">
                    <button onClick={() => updateQty(it.lineId, -1)} className="grid h-7 w-7 place-items-center text-ember-400">
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="w-6 text-center text-sm text-cream">{it.quantity}</span>
                    <button onClick={() => updateQty(it.lineId, 1)} className="grid h-7 w-7 place-items-center text-ember-400">
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-coal-800 p-4">
            <div className="mb-3 space-y-1 text-sm">
              <div className="flex justify-between text-ash">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {orderType === "DELIVERY" && (
                <div className="flex justify-between text-ash">
                  <span>Entrega</span>
                  <span className={deliveryFee === 0 ? "font-semibold text-success" : ""}>
                    {deliveryFee === 0 ? "GRÁTIS" : formatPrice(deliveryFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-coal-800 pt-1 text-base font-bold text-cream">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            {belowMin && (
              <p className="mb-2 text-center text-xs text-warning">Pedido mínimo de {formatPrice(minOrder)}</p>
            )}
            <Button className="w-full" disabled={belowMin} onClick={onCheckout}>
              Finalizar pedido
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
