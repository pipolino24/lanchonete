"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Clock, Flame, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrackingStep {
  key: string;
  label: string;
}

interface OrderTrackingParallaxCardProps {
  code: string;
  steps: TrackingStep[];
  currentIdx: number;
  canceled?: boolean;
  etaMinutes?: number | null;
  destination?: string | null;
}

const HERO_TITLES = [
  "Pedido recebido!",
  "Na brasa, preparando…",
  "Saiu para entrega",
  "Pedido concluído",
];

export function OrderTrackingParallaxCard({
  code,
  steps,
  currentIdx,
  canceled,
  etaMinutes,
  destination,
}: OrderTrackingParallaxCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // posição do mouse normalizada (-0.5 … 0.5)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 150, damping: 18 });
  const sy = useSpring(my, { stiffness: 150, damping: 18 });

  const rotateX = useTransform(sy, [-0.5, 0.5], [9, -9]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-9, 9]);

  // camadas com profundidades diferentes (efeito parallax)
  const glowX = useTransform(sx, [-0.5, 0.5], [-26, 26]);
  const glowY = useTransform(sy, [-0.5, 0.5], [-18, 18]);
  const emblemX = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const emblemY = useTransform(sy, [-0.5, 0.5], [-10, 10]);
  const textX = useTransform(sx, [-0.5, 0.5], [-6, 6]);

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

  const done = currentIdx >= steps.length - 1;
  const heroTitle = canceled ? "Pedido cancelado" : HERO_TITLES[Math.max(0, currentIdx)] ?? "Pedido recebido!";
  const progress = canceled ? 0 : ((currentIdx + 1) / steps.length) * 100;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative [perspective:1100px]"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        className="surface relative overflow-hidden rounded-3xl shadow-warm"
      >
        {/* Cena com brasa */}
        <div className="relative h-44 overflow-hidden">
          {/* brilho que segue o mouse */}
          <motion.div
            style={{ x: glowX, y: glowY }}
            className="absolute -inset-12 opacity-90"
            aria-hidden
          >
            <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,106,31,0.55),rgba(226,61,27,0.18)_45%,transparent_70%)] blur-xl" />
          </motion.div>

          {/* faíscas subindo */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {[12, 34, 58, 72, 88].map((left, i) => (
              <span
                key={left}
                className="absolute bottom-2 h-1 w-1 rounded-full bg-ember-400"
                style={{
                  left: `${left}%`,
                  animation: `spark-rise ${2.6 + (i % 3) * 0.6}s ease-in ${i * 0.45}s infinite`,
                }}
              />
            ))}
          </div>

          {/* emblema de fogo flutuante */}
          <motion.div
            style={{ x: emblemX, y: emblemY, translateZ: 60 }}
            className="absolute inset-0 grid place-items-center"
          >
            <motion.div
              animate={canceled ? {} : { y: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className={cn(
                "grid h-20 w-20 place-items-center rounded-full ring-1 ring-white/10",
                done ? "bg-success/20" : "bg-ember-500/20",
              )}
            >
              {done ? (
                <Check className="text-success" size={40} strokeWidth={2.5} />
              ) : (
                <Flame className="text-ember-400 animate-flicker" size={40} fill="currentColor" />
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Conteúdo */}
        <motion.div style={{ x: textX, translateZ: 30 }} className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-ash-dark">Pedido #{code}</p>
              <h1 className="mt-0.5 font-display text-2xl font-bold text-cream">{heroTitle}</h1>
            </div>
            {!canceled && etaMinutes ? (
              <div className="shrink-0 rounded-xl bg-coal-800 px-3 py-2 text-center ring-1 ring-coal-700">
                <p className="text-[10px] uppercase tracking-wide text-ash-dark">Previsão</p>
                <p className="flex items-center gap-1 font-display text-lg font-bold text-ember-400">
                  <Clock size={14} /> {etaMinutes}′
                </p>
              </div>
            ) : null}
          </div>

          {!canceled && destination && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ash">
              <MapPin size={14} className="text-ember-400" /> {destination}
            </p>
          )}

          {/* Barra de progresso */}
          {!canceled && (
            <>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-coal-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-ember-600 to-ember-400"
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                {steps.map((s, i) => {
                  const reached = i <= currentIdx;
                  return (
                    <div key={s.key} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className={cn(
                          "grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold transition-colors",
                          reached ? "bg-ember-500 text-white" : "bg-coal-800 text-ash-dark ring-1 ring-coal-700",
                        )}
                      >
                        {i < currentIdx ? <Check size={13} /> : i + 1}
                      </div>
                      <span className={cn("text-center text-[10px]", reached ? "text-cream" : "text-ash-dark")}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
