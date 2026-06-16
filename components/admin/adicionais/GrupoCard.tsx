"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  excluirGrupo,
  alternarDisponibilidadeGrupo,
} from "@/app/painel/(panel)/adicionais/actions";
import { GrupoForm, type GrupoFormData } from "./GrupoForm";

export type GrupoView = {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number; // centavos
  }[];
};

export function GrupoCard({ grupo }: { grupo: GrupoView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  function toggle() {
    startTransition(async () => {
      await alternarDisponibilidadeGrupo(grupo.id);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Excluir o grupo "${grupo.title}"? Os itens serão removidos.`)) return;
    startTransition(async () => {
      await excluirGrupo(grupo.id);
      router.refresh();
    });
  }

  const initial: GrupoFormData = {
    id: grupo.id,
    title: grupo.title,
    description: grupo.description ?? "",
    active: grupo.active,
    items: grupo.items.map((it) => ({
      name: it.name,
      price: it.price ? (it.price / 100).toFixed(2).replace(".", ",") : "",
      description: it.description ?? "",
    })),
  };

  return (
    <>
      <Card className={cn(pending && "opacity-60")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-cream">{grupo.title}</h2>
              <Badge tone="neutral">
                {grupo.items.length} {grupo.items.length === 1 ? "item" : "itens"}
              </Badge>
            </div>
            {grupo.description && (
              <p className="mt-0.5 text-sm text-ash">{grupo.description}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={pending}
              className="grid h-9 w-9 place-items-center rounded-lg text-ash hover:bg-coal-800 hover:text-cream disabled:opacity-50"
              aria-label="Editar grupo"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="grid h-9 w-9 place-items-center rounded-lg text-ash hover:bg-coal-800 hover:text-danger disabled:opacity-50"
              aria-label="Excluir grupo"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Toggle Disponível */}
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2.5">
          <span className="relative inline-flex">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={grupo.active}
              onChange={toggle}
              disabled={pending}
            />
            <span className="h-5 w-9 rounded-full bg-coal-700 transition-colors peer-checked:bg-ember-500" />
            <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-cream transition-transform peer-checked:translate-x-4" />
          </span>
          <span className="text-sm text-ash">
            {grupo.active ? "Disponível" : "Indisponível"}
          </span>
        </label>

        {/* Itens */}
        <div className="mt-3 border-t border-coal-800 pt-3">
          {grupo.items.length === 0 ? (
            <p className="text-sm text-ash-dark">Nenhum item neste grupo.</p>
          ) : (
            <ul className="divide-y divide-coal-800/70">
              {grupo.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-cream">{it.name}</p>
                    {it.description && (
                      <p className="truncate text-xs text-ash-dark">{it.description}</p>
                    )}
                  </div>
                  {it.price > 0 ? (
                    <span className="shrink-0 text-sm font-semibold text-ember-400">
                      {formatPrice(it.price)}
                    </span>
                  ) : (
                    <Badge tone="success">Grátis</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {editing && <GrupoForm initial={initial} onClose={() => setEditing(false)} />}
    </>
  );
}
