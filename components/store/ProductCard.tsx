"use client";

import { Plus } from "lucide-react";
import { ProductImage } from "@/components/store/ProductImage";
import { formatPrice } from "@/lib/money";
import type { MenuProduct } from "@/lib/queries";

export function ProductCard({
  product,
  emoji,
  onSelect,
}: {
  product: MenuProduct;
  emoji?: string;
  onSelect: (id: string) => void;
}) {
  const hasPromo = product.promoPrice != null && product.promoPrice < product.price;
  const measure = product.measureValue
    ? `${product.measureValue}${product.measureUnit ?? ""}`
    : null;

  return (
    <button
      onClick={() => onSelect(product.id)}
      className="group surface flex w-full items-stretch gap-3.5 rounded-2xl p-3 text-left shadow-warm transition-all duration-200 hover:-translate-y-0.5 hover:border-ember-500/40"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-snug text-cream group-hover:text-white">{product.name}</h3>
        {(measure || product.serves) && (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ash-dark">
            {measure && <span>{measure}</span>}
            {measure && product.serves ? <span className="opacity-50">•</span> : null}
            {product.serves ? <span>Serve {product.serves}</span> : null}
          </div>
        )}
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ash">{product.description}</p>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-[15px] font-bold text-ember-400">
            {formatPrice(hasPromo ? product.promoPrice! : product.price)}
          </span>
          {hasPromo && (
            <span className="text-xs text-ash-dark line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>

      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-coal-700">
        <ProductImage src={product.images[0]} alt={product.name} emoji={emoji} sizes="112px" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute bottom-1.5 right-1.5 grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-ember-400 to-ember-600 text-white shadow-lg shadow-ember-600/40 transition-transform duration-200 group-hover:scale-110">
          <Plus size={17} strokeWidth={3} />
        </span>
      </div>
    </button>
  );
}
