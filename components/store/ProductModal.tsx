"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Plus, Minus, Check, Loader2 } from "lucide-react";
import { ProductImage } from "@/components/store/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/money";
import { useCart, type CartComplement } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type DetailItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};
type DetailLink = {
  required: boolean;
  min: number;
  max: number;
  group: { id: string; title: string; description: string | null; items: DetailItem[] };
};
type Detail = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promoPrice: number | null;
  images: string[];
  measureValue: string | null;
  measureUnit: string | null;
  serves: number | null;
  removableIngredients: string[];
  complementLinks: DetailLink[];
};

export function ProductModal({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const addItem = useCart((s) => s.addItem);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  // selections[groupId][itemId] = qty
  const [selections, setSelections] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        if (active) {
          setDetail(d);
          setLoading(false);
        }
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [productId]);

  const basePrice = detail ? (detail.promoPrice ?? detail.price) : 0;

  const groupQty = (groupId: string) =>
    Object.values(selections[groupId] ?? {}).reduce((s, q) => s + q, 0);

  function changeItem(link: DetailLink, itemId: string, delta: number) {
    setSelections((prev) => {
      const group = { ...(prev[link.group.id] ?? {}) };
      const current = group[itemId] ?? 0;
      const total = groupQty(link.group.id);
      if (delta > 0 && link.max > 0 && total >= link.max) {
        // grupo cheio: se max=1, troca a seleção
        if (link.max === 1) {
          return { ...prev, [link.group.id]: { [itemId]: 1 } };
        }
        return prev;
      }
      const next = Math.max(0, current + delta);
      if (next === 0) delete group[itemId];
      else group[itemId] = next;
      return { ...prev, [link.group.id]: group };
    });
  }

  const complementsTotal = useMemo(() => {
    if (!detail) return 0;
    let sum = 0;
    for (const link of detail.complementLinks) {
      const sel = selections[link.group.id] ?? {};
      for (const item of link.group.items) {
        const q = sel[item.id] ?? 0;
        sum += item.price * q;
      }
    }
    return sum;
  }, [detail, selections]);

  const unitTotal = basePrice + complementsTotal;
  const total = unitTotal * quantity;

  const unmetRequired = useMemo(() => {
    if (!detail) return [];
    return detail.complementLinks.filter(
      (l) => l.required && groupQty(l.group.id) < Math.max(1, l.min),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, selections]);

  function handleAdd() {
    if (!detail || unmetRequired.length > 0) return;
    const complements: CartComplement[] = [];
    for (const link of detail.complementLinks) {
      const sel = selections[link.group.id] ?? {};
      for (const item of link.group.items) {
        const q = sel[item.id] ?? 0;
        if (q > 0)
          complements.push({
            itemId: item.id,
            groupId: link.group.id,
            groupTitle: link.group.title,
            name: item.name,
            price: item.price,
            quantity: q,
          });
      }
    }
    addItem({
      productId: detail.id,
      name: detail.name,
      image: detail.images[0],
      unitPrice: basePrice,
      quantity,
      note: note.trim() || undefined,
      removedIngredients: [...removed],
      complements,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-3xl border border-coal-700 bg-coal-900 sm:rounded-3xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-coal-900/80 text-cream backdrop-blur hover:bg-coal-800"
        >
          <X size={18} />
        </button>

        {loading || !detail ? (
          <div className="grid h-72 place-items-center">
            <Loader2 className="animate-spin text-ember-500" />
          </div>
        ) : (
          <>
            <div className="overflow-y-auto">
              <div className="relative h-56 w-full">
                <ProductImage src={detail.images[0]} alt={detail.name} className="!rounded-none" sizes="512px" />
                <div className="absolute inset-0 bg-gradient-to-t from-coal-900 to-transparent" />
              </div>

              <div className="px-5 pb-4">
                <h2 className="font-display text-2xl font-bold text-cream">{detail.name}</h2>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-ash">
                  {detail.serves ? <Badge tone="neutral">Serve {detail.serves}</Badge> : null}
                  {detail.measureValue ? (
                    <Badge tone="neutral">
                      {detail.measureValue}
                      {detail.measureUnit}
                    </Badge>
                  ) : null}
                </div>
                {detail.description && (
                  <p className="mt-2 text-sm text-ash">{detail.description}</p>
                )}
              </div>

              {/* Remoção de ingredientes */}
              {detail.removableIngredients.length > 0 && (
                <Section title="Deseja remover algum ingrediente?">
                  <div className="flex flex-wrap gap-2">
                    {detail.removableIngredients.map((ing) => {
                      const isRemoved = removed.has(ing);
                      return (
                        <button
                          key={ing}
                          onClick={() =>
                            setRemoved((prev) => {
                              const n = new Set(prev);
                              n.has(ing) ? n.delete(ing) : n.add(ing);
                              return n;
                            })
                          }
                          className={cn(
                            "rounded-full px-3 py-1.5 text-sm ring-1 transition-colors",
                            isRemoved
                              ? "bg-danger/15 text-danger line-through ring-danger/30"
                              : "bg-coal-800 text-cream ring-coal-700 hover:ring-coal-600",
                          )}
                        >
                          {ing}
                        </button>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Grupos de adicionais */}
              {detail.complementLinks.map((link) => {
                const total = groupQty(link.group.id);
                const unmet = link.required && total < Math.max(1, link.min);
                return (
                  <Section
                    key={link.group.id}
                    title={link.group.title}
                    badge={
                      link.required ? (
                        <Badge tone={unmet ? "danger" : "success"}>
                          {unmet ? "Obrigatório" : <Check size={12} />}
                        </Badge>
                      ) : link.max > 0 ? (
                        <span className="text-[11px] text-ash-dark">até {link.max}</span>
                      ) : null
                    }
                  >
                    <div className="divide-y divide-coal-800">
                      {link.group.items.map((item) => {
                        const q = selections[link.group.id]?.[item.id] ?? 0;
                        return (
                          <div key={item.id} className="flex items-center gap-3 py-2.5">
                            {item.imageUrl && (
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md">
                                <ProductImage src={item.imageUrl} alt={item.name} sizes="48px" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-cream">{item.name}</p>
                              {item.description && (
                                <p className="line-clamp-1 text-xs text-ash">{item.description}</p>
                              )}
                              {item.price > 0 && (
                                <p className="text-xs font-semibold text-ember-400">
                                  + {formatPrice(item.price)}
                                </p>
                              )}
                            </div>
                            {q > 0 ? (
                              <Stepper
                                value={q}
                                onMinus={() => changeItem(link, item.id, -1)}
                                onPlus={() => changeItem(link, item.id, 1)}
                              />
                            ) : (
                              <button
                                onClick={() => changeItem(link, item.id, 1)}
                                className="grid h-8 w-8 place-items-center rounded-lg bg-coal-800 text-ember-400 ring-1 ring-coal-700 hover:bg-coal-750"
                              >
                                <Plus size={16} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                );
              })}

              {/* Observação */}
              <Section title="Alguma observação?">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="Ex: tirar cebola, ponto da carne..."
                  className="w-full resize-none rounded-lg border border-coal-700 bg-coal-850 px-3 py-2 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-ash-dark">
                  Adicionais são multiplicados ao incluir mais de 1 item.
                </p>
              </Section>
            </div>

            {/* Rodapé fixo */}
            <div className="flex items-center gap-3 border-t border-coal-700 bg-coal-900 p-3">
              <Stepper
                large
                value={quantity}
                onMinus={() => setQuantity((q) => Math.max(1, q - 1))}
                onPlus={() => setQuantity((q) => q + 1)}
              />
              <Button
                size="lg"
                shimmer
                className="flex-1 justify-between"
                disabled={unmetRequired.length > 0}
                onClick={handleAdd}
              >
                <span>
                  {unmetRequired.length > 0 ? "Selecione os obrigatórios" : "Adicionar"}
                </span>
                <span>{formatPrice(total)}</span>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-coal-800 px-5 py-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-cream">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

function Stepper({
  value,
  onMinus,
  onPlus,
  large,
}: {
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  large?: boolean;
}) {
  const size = large ? "h-11" : "h-8";
  const btn = large ? "h-11 w-11" : "h-8 w-8";
  return (
    <div className={cn("inline-flex items-center rounded-lg bg-coal-800 ring-1 ring-coal-700", size)}>
      <button onClick={onMinus} className={cn("grid place-items-center text-ember-400", btn)}>
        <Minus size={16} strokeWidth={3} />
      </button>
      <span className="w-6 text-center text-sm font-semibold text-cream">{value}</span>
      <button onClick={onPlus} className={cn("grid place-items-center text-ember-400", btn)}>
        <Plus size={16} strokeWidth={3} />
      </button>
    </div>
  );
}
