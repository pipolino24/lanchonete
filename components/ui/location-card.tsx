"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MapPin, Navigation, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationCardProps {
  name: string;
  addressLine: string;
  mapsUrl: string;
  open: boolean;
  whatsappUrl?: string | null;
  className?: string;
}

export function LocationCard({ name, addressLine, mapsUrl, open, whatsappUrl, className }: LocationCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 220, damping: 20 });
  const sy = useSpring(my, { stiffness: 220, damping: 20 });

  const rotateX = useTransform(sy, [-0.5, 0.5], [14, -14]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const pinX = useTransform(sx, [-0.5, 0.5], [-22, 22]);
  const pinY = useTransform(sy, [-0.5, 0.5], [-16, 16]);
  const glareX = useTransform(sx, [-0.5, 0.5], ["20%", "80%"]);
  const glareOpacity = useTransform(sx, (v) => 0.18 + Math.abs(v) * 0.25);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    setHover(false);
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={onLeave}
      className={cn("group select-none [perspective:1000px]", className)}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{ scale: hover ? 1.03 : 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="surface relative rounded-3xl shadow-warm"
      >
        {/* Mapa estilizado (clipado no próprio bloco para manter o 3D do card) */}
        <div className="relative h-40 overflow-hidden rounded-t-3xl bg-coal-950">
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-coal-600) 1px, transparent 1px), linear-gradient(90deg, var(--color-coal-600) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden
          />
          <div className="absolute inset-0 opacity-30" aria-hidden>
            <div className="absolute -left-10 top-10 h-1 w-[140%] rotate-12 rounded bg-coal-600" />
            <div className="absolute left-0 top-24 h-1 w-[140%] -rotate-6 rounded bg-coal-600" />
            <div className="absolute left-1/3 top-0 h-[140%] w-1 rotate-12 rounded bg-coal-600" />
          </div>
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,106,31,0.35),transparent_65%)] blur-md" aria-hidden />

          {/* glare que segue o mouse */}
          <motion.div
            style={{ left: glareX, opacity: glareOpacity }}
            className="pointer-events-none absolute -top-10 h-[160%] w-24 -translate-x-1/2 bg-white blur-2xl"
            aria-hidden
          />
        </div>

        {/* Pino flutuante — pop em 3D (fica acima do recorte do mapa) */}
        <motion.div
          style={{ x: pinX, y: pinY, translateZ: 70 }}
          className="pointer-events-none absolute left-1/2 top-[5.25rem] -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-14 w-14 place-items-center rounded-full bg-ember-500 text-white shadow-lg shadow-ember-600/50 ring-4 ring-ember-500/20"
          >
            <MapPin size={24} fill="currentColor" />
          </motion.div>
        </motion.div>

        {/* Conteúdo — leve pop em 3D */}
        <div className="relative rounded-b-3xl p-5" style={{ transform: "translateZ(35px)" }}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl font-bold text-cream">{name}</h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                open ? "bg-success/15 text-success ring-success/25" : "bg-danger/15 text-danger ring-danger/25",
              )}
            >
              {open ? "Aberto agora" : "Fechado"}
            </span>
          </div>

          <p className="mt-2 flex items-start gap-2 text-sm text-ash">
            <MapPin size={16} className="mt-0.5 shrink-0 text-ember-400" /> {addressLine}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-ember-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ember-600/30 transition-transform hover:-translate-y-0.5"
            >
              <Navigation size={16} /> Como chegar
            </a>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-coal-700 bg-coal-850 px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:border-ember-500/40"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
