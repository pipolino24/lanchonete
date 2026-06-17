"use client";

import * as React from "react";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Clock, Plus, Star } from "lucide-react";
import { ProductImage } from "@/components/store/ProductImage";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  className?: string;
  imageUrl?: string | null;
  emoji?: string;
  name: string;
  description?: string | null;
  price: number; // centavos (preço atual)
  originalPrice?: number | null; // centavos (preço cheio, se houver promoção)
  measure?: string | null; // ex.: "730g · Serve 1"
  prepTimeInMinutes?: number | null;
  featured?: boolean;
  productId: string;
  onAdd: (id: string) => void;
}

const cardVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export const MenuItemCard = React.memo(function MenuItemCard({
  className,
  imageUrl,
  emoji,
  name,
  description,
  price,
  originalPrice,
  measure,
  prepTimeInMinutes,
  featured,
  productId,
  onAdd,
}: MenuItemCardProps) {
  const savings = originalPrice && originalPrice > price ? originalPrice - price : 0;

  // Tilt 3D sutil que acompanha o mouse (movimento leve e macio)
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 110, damping: 22, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 110, damping: 22, mass: 0.5 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [8.4, -8.4]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-8.4, 8.4]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("relative [perspective:900px] hover:z-10", className)}
    >
      <motion.div
        variants={cardVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        style={{ rotateX, rotateY, backfaceVisibility: "hidden", willChange: "transform" }}
        className="group surface relative flex w-full flex-col overflow-hidden rounded-2xl shadow-warm transition-shadow duration-200 hover:shadow-[0_24px_50px_-14px_rgba(0,0,0,0.6),0_8px_22px_-8px_rgba(242,106,31,0.28)]"
      >
        {/* Imagem + botão Adicionar */}
        <button onClick={() => onAdd(productId)} className="relative block overflow-hidden text-left" aria-label={`Adicionar ${name}`}>
          <div className="relative h-40 w-full overflow-hidden">
            <div className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-105">
              <ProductImage src={imageUrl} alt={name} emoji={emoji} sizes="(max-width:640px) 50vw, 240px" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-coal-950/80 via-transparent to-transparent" />
          </div>

          {featured && (
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-ember-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
              <Star size={10} fill="currentColor" /> Destaque
            </span>
          )}
          {savings > 0 && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
              Economize {formatPrice(savings)}
            </span>
          )}

          {/* Botão flutuante "Adicionar" — aparece no hover */}
          <span className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="translate-y-3 rounded-lg border border-ember-500/40 bg-ember-500/90 px-6 py-2 text-xs font-bold uppercase text-white opacity-0 shadow-lg shadow-ember-600/30 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <Plus className="-mt-0.5 mr-1 inline" size={14} strokeWidth={3} /> Adicionar
            </span>
          </span>
        </button>

        {/* Conteúdo */}
        <button onClick={() => onAdd(productId)} className="flex flex-grow flex-col p-3 text-left">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-ember-400">{formatPrice(price)}</span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-ash-dark line-through">{formatPrice(originalPrice)}</span>
            )}
          </div>

          <h3 className="mt-1 text-sm font-semibold leading-tight text-cream">{name}</h3>
          {measure && <p className="mt-0.5 text-[11px] text-ash-dark">{measure}</p>}
          {description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ash">{description}</p>}

          {prepTimeInMinutes ? (
            <div className="mt-auto flex items-center gap-1.5 pt-2 text-[11px] text-ash-dark">
              <Clock className="h-3 w-3" />
              <span>~{prepTimeInMinutes} min</span>
            </div>
          ) : null}
        </button>
      </motion.div>
    </div>
  );
});
