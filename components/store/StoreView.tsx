"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Star, Search, X } from "lucide-react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { CategoryNav } from "@/components/store/CategoryNav";
import { DesktopCategoryRail } from "@/components/store/DesktopCategoryRail";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductImage } from "@/components/store/ProductImage";
import { ProductModal } from "@/components/store/ProductModal";
import { CartPanel } from "@/components/store/CartPanel";
import { CartSheet } from "@/components/store/CartSheet";
import { Logo } from "@/components/brand/Logo";
import { formatPrice } from "@/lib/money";
import { useCart, cartCount, cartSubtotal } from "@/lib/cart-store";
import type { MenuProduct } from "@/lib/queries";

type PaymentMethod = "PIX" | "CASH" | "CREDIT" | "DEBIT" | "MEAL_VOUCHER" | "FOOD_VOUCHER";

export type StoreViewData = {
  slug: string;
  name: string;
  coverUrl: string | null;
  logoUrl: string | null;
  minOrder: number;
  freeShippingAbove: number | null;
  isOpen: boolean;
  deliveryFeePreview: number;
  hours: { weekday: number; openTime: string; closeTime: string; active: boolean }[];
  categories: { id: string; name: string; emoji: string | null; products: MenuProduct[] }[];
  featured: MenuProduct[];
  payments: { method: PaymentMethod; enabledDelivery: boolean; enabledPickup: boolean }[];
};

export function StoreView({ data }: { data: StoreViewData }) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "identify">("cart");
  const [query, setQuery] = useState("");
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  const subtotal = cartSubtotal(items);

  useEffect(() => {
    useCart.getState().setStore(data.slug);
  }, [data.slug]);

  const q = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q) return null;
    const all = data.categories.flatMap((c) =>
      c.products.map((p) => ({ product: p, emoji: c.emoji })),
    );
    return all.filter(
      ({ product }) =>
        product.name.toLowerCase().includes(q) ||
        (product.description ?? "").toLowerCase().includes(q),
    );
  }, [q, data.categories]);

  function openCheckout(step: "cart" | "identify") {
    setCheckoutStep(step);
    setCartOpen(true);
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <StoreHeader
        name={data.name}
        coverUrl={data.coverUrl}
        logoUrl={data.logoUrl}
        isOpen={data.isOpen}
        minOrder={data.minOrder}
        hours={data.hours}
      />

      {/* Navegação de categorias — mobile (chips fixos) */}
      <div className="mt-6 lg:hidden">
        <CategoryNav categories={data.categories.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))} />
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4 lg:px-6">
        <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)_340px] lg:gap-6">
          {/* Rail de categorias — desktop */}
          <aside className="hidden lg:block">
            <DesktopCategoryRail
              categories={data.categories.map((c) => ({
                id: c.id,
                name: c.name,
                emoji: c.emoji,
                count: c.products.length,
              }))}
            />
          </aside>

          {/* Produtos */}
          <div className="min-w-0">
            {/* Busca */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash-dark" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no cardápio..."
                className="w-full rounded-xl border border-coal-700 bg-coal-850 py-3 pl-11 pr-10 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ash-dark hover:text-cream"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {searchResults !== null ? (
              <section className="py-2">
                <h2 className="mb-3 font-display text-xl font-bold text-cream">
                  {searchResults.length} resultado{searchResults.length === 1 ? "" : "s"} para “{query}”
                </h2>
                {searchResults.length === 0 ? (
                  <p className="py-10 text-center text-ash">Nada encontrado. Tente outro termo.</p>
                ) : (
                  <div className="grid gap-2.5 xl:grid-cols-2">
                    {searchResults.map(({ product, emoji }) => (
                      <ProductCard key={product.id} product={product} emoji={emoji ?? "🍔"} onSelect={setSelectedProduct} />
                    ))}
                  </div>
                )}
              </section>
            ) : (
            <>
            {data.featured.length > 0 && (
              <section className="pb-2">
                <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-cream">
                  <Star size={18} className="text-ember-500" fill="currentColor" /> Destaques
                </h2>
                <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                  {data.featured.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p.id)}
                      className="group surface w-48 shrink-0 overflow-hidden rounded-2xl text-left shadow-warm transition-all duration-200 hover:-translate-y-0.5 hover:border-ember-500/40"
                    >
                      <div className="relative h-32 w-full">
                        <ProductImage src={p.images[0]} alt={p.name} sizes="192px" />
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-coal-850 via-coal-850/30 to-transparent" />
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-1 text-sm font-semibold text-cream">{p.name}</p>
                        <p className="mt-0.5 text-sm font-bold text-ember-400">{formatPrice(p.promoPrice ?? p.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {data.categories.map((cat) => (
              <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-24 py-4">
                <h2 className="mb-3 font-display text-xl font-bold text-cream">
                  {cat.emoji ? `${cat.emoji} ` : ""}
                  {cat.name}
                </h2>
                <div className="grid gap-2.5 xl:grid-cols-2">
                  {cat.products.map((p) => (
                    <ProductCard key={p.id} product={p} emoji={cat.emoji ?? "🍔"} onSelect={setSelectedProduct} />
                  ))}
                </div>
              </section>
            ))}
            </>
            )}

            <footer className="flex flex-col items-center gap-2 py-10 text-center">
              <Logo size="sm" />
              <p className="text-xs text-ash-dark">Cardápio digital · feito com 🔥 no Cariri</p>
            </footer>
          </div>

          {/* Carrinho fixo — desktop */}
          <aside className="hidden lg:block">
            <CartPanel
              minOrder={data.minOrder}
              freeShippingAbove={data.freeShippingAbove}
              deliveryFeePreview={data.deliveryFeePreview}
              onCheckout={() => openCheckout("identify")}
            />
          </aside>
        </div>
      </div>

      {/* Barra de carrinho flutuante — mobile */}
      {count > 0 && !cartOpen && !selectedProduct && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 lg:hidden">
          <button
            onClick={() => openCheckout("cart")}
            className="mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl bg-ember-500 px-4 py-3.5 font-semibold text-white shadow-xl shadow-ember-600/30"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-sm">{count}</span>
            <span className="flex items-center gap-1">
              <ShoppingBag size={18} /> Ver sacola
            </span>
            <span className="ml-auto">{formatPrice(subtotal)}</span>
          </button>
        </div>
      )}

      {selectedProduct && (
        <ProductModal productId={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {cartOpen && (
        <CartSheet
          slug={data.slug}
          minOrder={data.minOrder}
          freeShippingAbove={data.freeShippingAbove}
          deliveryFeePreview={data.deliveryFeePreview}
          payments={data.payments}
          initialStep={checkoutStep}
          onClose={() => setCartOpen(false)}
          onAddMore={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}
