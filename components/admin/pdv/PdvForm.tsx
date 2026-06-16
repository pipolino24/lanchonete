"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, Bike, Store, Armchair, Search, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductImage } from "@/components/store/ProductImage";
import { formatPrice, parseToCents } from "@/lib/money";
import { cn } from "@/lib/utils";

export type PdvProduct = { id: string; name: string; price: number; image: string | null };
export type PdvCategory = { id: string; name: string; emoji: string | null; products: PdvProduct[] };

type OrderType = "DELIVERY" | "PICKUP" | "DINEIN";
type Line = { id: string; name: string; price: number; qty: number };

const TYPES: { type: OrderType; label: string; icon: React.ReactNode }[] = [
  { type: "DINEIN", label: "Mesa / Balcão", icon: <Armchair size={15} /> },
  { type: "PICKUP", label: "Retirada", icon: <Store size={15} /> },
  { type: "DELIVERY", label: "Delivery", icon: <Bike size={15} /> },
];

const PAYMENTS = [
  { v: "CASH", l: "Dinheiro" },
  { v: "PIX", l: "Pix" },
  { v: "CREDIT", l: "Crédito" },
  { v: "DEBIT", l: "Débito" },
] as const;

const inputCls =
  "w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none";

export function PdvForm({
  categories,
  initialTable,
  initialType,
  action,
}: {
  categories: PdvCategory[];
  initialTable: string;
  initialType: OrderType;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [type, setType] = useState<OrderType>(initialType);
  const [table, setTable] = useState(initialTable);
  const [comanda, setComanda] = useState("");
  const [attendant, setAttendant] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState<string>("");
  const [discount, setDiscount] = useState("");
  const [surcharge, setSurcharge] = useState("");
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  function add(p: PdvProduct) {
    setLines((prev) => {
      const found = prev.find((l) => l.id === p.id);
      if (found) return prev.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }
  function changeQty(id: string, d: number) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0),
    );
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const total = Math.max(0, subtotal - parseToCents(discount || "0") + parseToCents(surcharge || "0"));

  const payload = useMemo(
    () =>
      JSON.stringify({
        type,
        table,
        comanda,
        attendant,
        customer: { name, phone },
        paymentMethod: payment || undefined,
        items: lines.map((l) => ({ productId: l.id, quantity: l.qty })),
        discount,
        surcharge,
      }),
    [type, table, comanda, attendant, name, phone, payment, lines, discount, surcharge],
  );

  const filtered = categories
    .map((c) => ({
      ...c,
      products: c.products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    }))
    .filter((c) => c.products.length > 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      {/* Seletor de produtos */}
      <div>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ash-dark" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className={cn(inputCls, "pl-9")}
          />
        </div>
        <div className="space-y-5">
          {filtered.map((c) => (
            <div key={c.id}>
              <h3 className="mb-2 font-display text-lg font-bold text-cream">
                {c.emoji ? `${c.emoji} ` : ""}
                {c.name}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {c.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => add(p)}
                    className="surface flex items-center gap-3 rounded-xl p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-ember-500/40"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-coal-700">
                      <ProductImage src={p.image} alt={p.name} sizes="48px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-cream">{p.name}</p>
                      <p className="text-sm font-semibold text-ember-400">{formatPrice(p.price)}</p>
                    </div>
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-ember-500/15 text-ember-400">
                      <Plus size={15} strokeWidth={3} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumo do pedido */}
      <form action={action} className="surface h-fit space-y-4 rounded-2xl p-4 lg:sticky lg:top-6">
        <div className="flex gap-1 rounded-xl bg-coal-900 p-1 ring-1 ring-coal-700">
          {TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => setType(t.type)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                type === t.type ? "bg-ember-500 text-white" : "text-ash hover:text-cream",
              )}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cliente (opcional)" className={inputCls} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" className={inputCls} />
          {type === "DINEIN" && (
            <>
              <input value={table} onChange={(e) => setTable(e.target.value)} placeholder="Mesa" className={inputCls} />
              <input value={comanda} onChange={(e) => setComanda(e.target.value)} placeholder="Comanda" className={inputCls} />
            </>
          )}
          <input value={attendant} onChange={(e) => setAttendant(e.target.value)} placeholder="Atendente" className={cn(inputCls, "col-span-2")} />
        </div>

        {/* Itens */}
        <div className="space-y-2">
          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-ash-dark">Adicione produtos ao pedido</p>
          ) : (
            lines.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg bg-coal-900 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-cream">{l.name}</p>
                  <p className="text-xs text-ember-400">{formatPrice(l.price * l.qty)}</p>
                </div>
                <div className="inline-flex items-center rounded-lg bg-coal-800 ring-1 ring-coal-700">
                  <button type="button" onClick={() => changeQty(l.id, -1)} className="grid h-7 w-7 place-items-center text-ember-400">
                    <Minus size={13} strokeWidth={3} />
                  </button>
                  <span className="w-5 text-center text-sm text-cream">{l.qty}</span>
                  <button type="button" onClick={() => changeQty(l.id, 1)} className="grid h-7 w-7 place-items-center text-ember-400">
                    <Plus size={13} strokeWidth={3} />
                  </button>
                </div>
                <button type="button" onClick={() => changeQty(l.id, -l.qty)} className="text-ash-dark hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ash">Desconto</span>
            <input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="R$ 0,00" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ash">Acréscimo</span>
            <input value={surcharge} onChange={(e) => setSurcharge(e.target.value)} placeholder="R$ 0,00" className={inputCls} />
          </label>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium text-ash">Pagamento</span>
          <div className="grid grid-cols-4 gap-1">
            {PAYMENTS.map((p) => (
              <button
                key={p.v}
                type="button"
                onClick={() => setPayment(payment === p.v ? "" : p.v)}
                className={cn(
                  "rounded-lg py-1.5 text-xs font-medium ring-1 transition-colors",
                  payment === p.v ? "bg-ember-500 text-white ring-ember-500" : "bg-coal-900 text-ash ring-coal-700",
                )}
              >
                {p.l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between border-t border-coal-700 pt-3 text-lg font-bold text-cream">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        <input type="hidden" name="payload" value={payload} />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={lines.length === 0}>
            Salvar venda
          </Button>
          <Button
            type="submit"
            variant="secondary"
            disabled={lines.length === 0}
            onClick={() => setTimeout(() => window.print(), 100)}
          >
            <Printer size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
