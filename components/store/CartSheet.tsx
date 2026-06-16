"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  X, ChevronLeft, Trash2, Plus, Minus, Bike, ShoppingBag,
  Banknote, QrCode, CreditCard, Check, Loader2, PartyPopper, Flame, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/money";
import {
  useCart, cartSubtotal, lineTotal, type OrderType, type CartLine,
} from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type PaymentMethod = "PIX" | "CASH" | "CREDIT" | "DEBIT" | "MEAL_VOUCHER" | "FOOD_VOUCHER";
type Step = "cart" | "identify" | "payment" | "review" | "success";

const PAYMENT_LABELS: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  CASH: { label: "Dinheiro", icon: <Banknote size={18} /> },
  PIX: { label: "Pix", icon: <QrCode size={18} /> },
  CREDIT: { label: "Crédito", icon: <CreditCard size={18} /> },
  DEBIT: { label: "Débito", icon: <CreditCard size={18} /> },
  MEAL_VOUCHER: { label: "Vale Refeição", icon: <CreditCard size={18} /> },
  FOOD_VOUCHER: { label: "Vale Alimentação", icon: <CreditCard size={18} /> },
};

export function CartSheet({
  slug,
  minOrder,
  freeShippingAbove,
  deliveryFeePreview,
  payments,
  pixKey,
  pixKeyType,
  cartMessage,
  initialStep = "cart",
  onClose,
  onAddMore,
}: {
  slug: string;
  minOrder: number;
  freeShippingAbove: number | null;
  deliveryFeePreview: number;
  payments: { method: PaymentMethod; enabledDelivery: boolean; enabledPickup: boolean }[];
  pixKey?: string | null;
  pixKeyType?: string | null;
  cartMessage?: string | null;
  initialStep?: Step;
  onClose: () => void;
  onAddMore: () => void;
}) {
  const { items, orderType, customer, address, setOrderType, setCustomer, setAddress, updateQty, removeItem, clear } =
    useCart();
  const [step, setStep] = useState<Step>(initialStep);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [changeFor, setChangeFor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cartSubtotal(items);
  const deliveryFee =
    orderType !== "DELIVERY"
      ? 0
      : freeShippingAbove != null && subtotal >= freeShippingAbove
        ? 0
        : deliveryFeePreview;
  const total = subtotal + deliveryFee;

  const availablePayments = useMemo(
    () =>
      payments.filter((p) =>
        orderType === "DELIVERY" ? p.enabledDelivery : p.enabledPickup,
      ),
    [payments, orderType],
  );

  const belowMin = subtotal < minOrder;
  const canIdentify =
    customer.name.trim() &&
    customer.phone.trim() &&
    (orderType !== "DELIVERY" || (address.street.trim() && address.number.trim()));

  async function lookupCep(value: string) {
    setAddress({ zipCode: value });
    const digits = value.replace(/\D/g, "");
    if (digits.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const d = await res.json();
        if (!d.erro) {
          setAddress({
            street: d.logradouro || "",
            neighborhood: d.bairro || "",
            city: d.localidade || "",
            state: d.uf || "",
          });
        }
      } catch {
        /* ignora falha de CEP */
      }
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/stores/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: orderType,
          customer,
          address: orderType === "DELIVERY" ? address : null,
          items: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            note: it.note,
            removedIngredients: it.removedIngredients,
            complements: it.complements.map((c) => ({ itemId: c.itemId, quantity: c.quantity })),
          })),
          paymentMethod: payment,
          changeFor: payment === "CASH" && changeFor ? Math.round(parseFloat(changeFor.replace(",", ".")) * 100) : null,
        }),
      });
      if (!res.ok) throw new Error("Falha ao enviar pedido");
      const data = await res.json();
      setOrderCode(data.code);
      clear();
      setStep("success");
    } catch (e) {
      setError("Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl border border-coal-700 bg-coal-900 sm:rounded-3xl">
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 border-b border-coal-800 p-4">
          {step !== "cart" && step !== "success" && (
            <button
              onClick={() => setStep(step === "payment" ? "identify" : step === "review" ? "payment" : "cart")}
              className="grid h-8 w-8 place-items-center rounded-lg text-ash hover:bg-coal-800"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <h2 className="flex-1 font-display text-lg font-bold text-cream">
            {step === "cart" && "Seu pedido"}
            {step === "identify" && "Seus dados"}
            {step === "payment" && "Pagamento"}
            {step === "review" && "Revisar pedido"}
            {step === "success" && "Pedido enviado!"}
          </h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ash hover:bg-coal-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === "cart" && (
            <>
              {cartMessage && items.length > 0 && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-ember-500/25 bg-ember-500/10 p-3 text-sm text-ember-300">
                  <Flame size={16} className="mt-0.5 shrink-0 text-ember-400" />
                  <span>{cartMessage}</span>
                </div>
              )}
              <CartStep
                items={items}
                orderType={orderType}
                onType={setOrderType}
                onQty={updateQty}
                onRemove={removeItem}
                onAddMore={onAddMore}
              />
            </>
          )}

          {step === "identify" && (
            <div className="space-y-4">
              <TypeToggle orderType={orderType} onType={setOrderType} />
              <Field label="Seu nome">
                <input
                  value={customer.name}
                  onChange={(e) => setCustomer({ name: e.target.value })}
                  className="input"
                  placeholder="Nome completo"
                />
              </Field>
              <Field label="Telefone / WhatsApp">
                <input
                  value={customer.phone}
                  onChange={(e) => setCustomer({ phone: e.target.value })}
                  className="input"
                  placeholder="(88) 99999-9999"
                />
              </Field>
              {orderType === "DELIVERY" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="CEP">
                      <input value={address.zipCode} onChange={(e) => lookupCep(e.target.value)} className="input" placeholder="00000-000" inputMode="numeric" />
                    </Field>
                    <Field label="Número">
                      <input value={address.number} onChange={(e) => setAddress({ number: e.target.value })} className="input" placeholder="123" />
                    </Field>
                  </div>
                  <Field label="Rua">
                    <input value={address.street} onChange={(e) => setAddress({ street: e.target.value })} className="input" placeholder="Nome da rua" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Bairro">
                      <input value={address.neighborhood} onChange={(e) => setAddress({ neighborhood: e.target.value })} className="input" placeholder="Bairro" />
                    </Field>
                    <Field label="Cidade">
                      <input value={address.city} onChange={(e) => setAddress({ city: e.target.value })} className="input" placeholder="Cidade" />
                    </Field>
                  </div>
                  <Field label="Complemento / referência (opcional)">
                    <input value={address.complement} onChange={(e) => setAddress({ complement: e.target.value })} className="input" placeholder="Apto, bloco, ponto de referência" />
                  </Field>
                </>
              )}
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-3">
              <p className="text-sm text-ash">Como você vai pagar?</p>
              {availablePayments.map((p) => (
                <button
                  key={p.method}
                  onClick={() => setPayment(p.method)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                    payment === p.method
                      ? "border-ember-500 bg-ember-500/10"
                      : "border-coal-700 bg-coal-850 hover:border-coal-600",
                  )}
                >
                  <span className="text-ember-400">{PAYMENT_LABELS[p.method].icon}</span>
                  <span className="flex-1 font-medium text-cream">{PAYMENT_LABELS[p.method].label}</span>
                  {payment === p.method && <Check size={18} className="text-ember-500" />}
                </button>
              ))}
              {payment === "CASH" && (
                <Field label="Troco para quanto? (opcional)">
                  <input
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                    className="input"
                    placeholder="R$ 0,00"
                    inputMode="decimal"
                  />
                </Field>
              )}
              {payment === "PIX" && pixKey && (
                <div className="rounded-xl border border-ember-500/25 bg-ember-500/10 p-3.5">
                  <p className="text-xs text-ash">
                    Chave Pix
                    {pixKeyType
                      ? ` · ${({ CPF: "CPF", CNPJ: "CNPJ", EMAIL: "E-mail", PHONE: "Telefone", RANDOM: "Aleatória" } as Record<string, string>)[pixKeyType] ?? pixKeyType}`
                      : ""}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="flex-1 break-all text-sm font-semibold text-cream">{pixKey}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(pixKey)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-coal-800 text-ember-400 ring-1 ring-coal-700 hover:bg-coal-750"
                      title="Copiar chave"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-ash">
                    Pague pela chave no app do seu banco e leve o comprovante na entrega/retirada.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <Summary items={items} />
              <div className="rounded-xl border border-coal-800 bg-coal-850 p-3 text-sm">
                <Row label="Entrega" value={orderType === "DELIVERY" ? "Delivery" : orderType === "PICKUP" ? "Retirada" : "Mesa"} />
                <Row label="Cliente" value={customer.name} />
                {orderType === "DELIVERY" && <Row label="Endereço" value={`${address.street}, ${address.number}`} />}
                <Row label="Pagamento" value={payment ? PAYMENT_LABELS[payment].label : "—"} />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
            </div>
          )}

          {step === "success" && (
            <div className="grid place-items-center py-8 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
                <PartyPopper size={32} />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold text-cream">Pedido confirmado!</h3>
              <p className="mt-1 text-ash">
                Código <span className="font-semibold text-ember-400">{orderCode}</span>
              </p>
              <p className="mt-2 max-w-xs text-sm text-ash">
                Já recebemos seu pedido e ele está sendo preparado. 🔥
              </p>
              <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
                {orderCode && (
                  <Link href={`/cardapio/${slug}/pedido/${encodeURIComponent(orderCode)}`}>
                    <Button className="w-full">Acompanhar pedido</Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={onClose}>
                  Voltar ao cardápio
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        {step !== "success" && (
          <div className="border-t border-coal-700 bg-coal-900 p-4">
            {step === "cart" && (
              <>
                <Totals subtotal={subtotal} deliveryFee={deliveryFee} orderType={orderType} total={total} />
                {belowMin && (
                  <p className="mb-2 text-center text-xs text-warning">
                    Pedido mínimo de {formatPrice(minOrder)}
                  </p>
                )}
                <Button className="w-full" disabled={!items.length || belowMin} onClick={() => setStep("identify")}>
                  Continuar
                </Button>
              </>
            )}
            {step === "identify" && (
              <Button className="w-full" disabled={!canIdentify} onClick={() => setStep("payment")}>
                Ir para pagamento
              </Button>
            )}
            {step === "payment" && (
              <Button className="w-full" disabled={!payment} onClick={() => setStep("review")}>
                Revisar pedido
              </Button>
            )}
            {step === "review" && (
              <Button className="w-full justify-between" shimmer disabled={submitting} onClick={submit}>
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <span>Fazer pedido</span>}
                <span>{formatPrice(total)}</span>
              </Button>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid var(--color-coal-700);
          background: var(--color-coal-850);
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-cream);
        }
        .input::placeholder { color: var(--color-ash-dark); }
        .input:focus { outline: none; border-color: var(--color-ember-500); }
      `}</style>
    </div>
  );
}

function CartStep({
  items, orderType, onType, onQty, onRemove, onAddMore,
}: {
  items: CartLine[];
  orderType: OrderType;
  onType: (t: OrderType) => void;
  onQty: (id: string, d: number) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
}) {
  if (!items.length) {
    return (
      <div className="grid place-items-center py-10 text-center text-ash">
        <ShoppingBag size={40} className="opacity-40" />
        <p className="mt-3">Seu carrinho está vazio</p>
        <Button variant="secondary" className="mt-4" onClick={onAddMore}>Ver cardápio</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <TypeToggle orderType={orderType} onType={onType} />
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.lineId} className="rounded-xl border border-coal-800 bg-coal-850 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-cream">{it.name}</p>
                {it.complements.map((c) => (
                  <p key={c.itemId} className="text-xs text-ash">+ {c.quantity}× {c.name}</p>
                ))}
                {it.removedIngredients.map((r) => (
                  <p key={r} className="text-xs text-danger">− {r}</p>
                ))}
                {it.note && <p className="mt-0.5 text-xs italic text-ash-dark">“{it.note}”</p>}
              </div>
              <button onClick={() => onRemove(it.lineId)} className="text-ash-dark hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-semibold text-ember-400">{formatPrice(lineTotal(it))}</span>
              <div className="inline-flex items-center rounded-lg bg-coal-800 ring-1 ring-coal-700">
                <button onClick={() => onQty(it.lineId, -1)} className="grid h-8 w-8 place-items-center text-ember-400">
                  <Minus size={15} strokeWidth={3} />
                </button>
                <span className="w-6 text-center text-sm text-cream">{it.quantity}</span>
                <button onClick={() => onQty(it.lineId, 1)} className="grid h-8 w-8 place-items-center text-ember-400">
                  <Plus size={15} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onAddMore} className="w-full rounded-xl border border-dashed border-coal-700 py-2.5 text-sm font-medium text-ember-400 hover:bg-coal-850">
        + Adicionar mais itens
      </button>
    </div>
  );
}

function TypeToggle({ orderType, onType }: { orderType: OrderType; onType: (t: OrderType) => void }) {
  const opts: { type: OrderType; label: string; icon: React.ReactNode }[] = [
    { type: "DELIVERY", label: "Delivery", icon: <Bike size={16} /> },
    { type: "PICKUP", label: "Retirada", icon: <ShoppingBag size={16} /> },
  ];
  return (
    <div className="flex gap-2 rounded-xl bg-coal-850 p-1 ring-1 ring-coal-700">
      {opts.map((o) => (
        <button
          key={o.type}
          onClick={() => onType(o.type)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
            orderType === o.type ? "bg-ember-500 text-white" : "text-ash hover:text-cream",
          )}
        >
          {o.icon} {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ash">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-ash">{label}</span>
      <span className="text-right font-medium text-cream">{value}</span>
    </div>
  );
}

function Totals({ subtotal, deliveryFee, orderType, total }: { subtotal: number; deliveryFee: number; orderType: OrderType; total: number }) {
  return (
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
  );
}

function Summary({ items }: { items: CartLine[] }) {
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.lineId} className="flex justify-between text-sm">
          <span className="text-cream">{it.quantity}× {it.name}</span>
          <span className="text-ash">{formatPrice(lineTotal(it))}</span>
        </div>
      ))}
    </div>
  );
}
