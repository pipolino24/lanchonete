"use client";

import { useMemo, useState } from "react";
import { Users, Phone, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/admin/ui";
import { excluirCliente } from "@/app/painel/(panel)/clientes/actions";

export type ClienteRow = {
  id: string;
  name: string;
  phone: string;
  createdAt: string; // ISO
  ordersCount: number;
  lastOrderAt: string | null; // ISO
};

type SegKey = "todos" | "novos" | "recorrentes" | "risco" | "inativos";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DAY = 24 * 60 * 60 * 1000;

// Segmentação:
// Novos        = createdAt nos últimos 7 dias
// Recorrentes  = mais de 1 pedido
// Em risco     = tem pedidos, mas o último foi há mais de 30 dias (e menos de 60)
// Inativos     = tem pedidos, mas o último foi há 60+ dias
function matchesSegment(c: ClienteRow, seg: SegKey, now: number): boolean {
  if (seg === "todos") return true;

  if (seg === "novos") {
    return now - new Date(c.createdAt).getTime() <= 7 * DAY;
  }

  if (seg === "recorrentes") {
    return c.ordersCount > 1;
  }

  // risco / inativos dependem de ter pedidos
  if (!c.lastOrderAt) return false;
  const sinceLast = now - new Date(c.lastOrderAt).getTime();

  if (seg === "risco") {
    return sinceLast > 30 * DAY && sinceLast <= 60 * DAY;
  }

  if (seg === "inativos") {
    return sinceLast > 60 * DAY;
  }

  return true;
}

const tabs: { key: SegKey; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "novos", label: "Novos" },
  { key: "recorrentes", label: "Recorrentes" },
  { key: "risco", label: "Em risco" },
  { key: "inativos", label: "Inativos" },
];

const emptyCopy: Record<SegKey, { title: string; description: string }> = {
  todos: {
    title: "Nenhum cliente ainda",
    description: "Cadastre seu primeiro cliente usando o formulário acima.",
  },
  novos: {
    title: "Nenhum cliente novo",
    description: "Nenhum cadastro nos últimos 7 dias.",
  },
  recorrentes: {
    title: "Nenhum cliente recorrente",
    description: "Clientes com mais de um pedido aparecem aqui.",
  },
  risco: {
    title: "Nenhum cliente em risco",
    description: "Clientes sem pedidos há mais de 30 dias aparecem aqui.",
  },
  inativos: {
    title: "Nenhum cliente inativo",
    description: "Clientes sem pedidos há 60 dias ou mais aparecem aqui.",
  },
};

export function ClientesTabs({ customers }: { customers: ClienteRow[] }) {
  const [seg, setSeg] = useState<SegKey>("todos");
  const now = Date.now();

  const counts = useMemo(() => {
    const acc: Record<SegKey, number> = {
      todos: 0,
      novos: 0,
      recorrentes: 0,
      risco: 0,
      inativos: 0,
    };
    for (const t of tabs) {
      acc[t.key] = customers.filter((c) => matchesSegment(c, t.key, now)).length;
    }
    return acc;
  }, [customers, now]);

  const filtered = useMemo(
    () => customers.filter((c) => matchesSegment(c, seg, now)),
    [customers, seg, now],
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSeg(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              seg === t.key
                ? "bg-ember-500/15 text-ember-400 ring-1 ring-ember-500/25"
                : "text-ash hover:bg-coal-800 hover:text-cream",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-md px-1.5 text-xs",
                seg === t.key ? "bg-ember-500/20 text-ember-300" : "bg-coal-800 text-ash-dark",
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title={emptyCopy[seg].title}
          description={emptyCopy[seg].description}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-coal-800 text-left text-xs font-medium uppercase tracking-wide text-ash-dark">
                <th className="px-3 py-2.5 font-medium">Cliente</th>
                <th className="px-3 py-2.5 font-medium">Telefone</th>
                <th className="px-3 py-2.5 text-center font-medium">Pedidos</th>
                <th className="px-3 py-2.5 font-medium">Último pedido</th>
                <th className="px-3 py-2.5 font-medium">Cadastro</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-coal-800">
              {filtered.map((c) => {
                const createdAt = new Date(c.createdAt);
                const isNew = now - createdAt.getTime() <= 7 * DAY;
                return (
                  <tr key={c.id} className="text-cream">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        {isNew && <Badge tone="success">Novo</Badge>}
                        {c.ordersCount > 1 && <Badge tone="info">Recorrente</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ash">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={14} className="text-ash-dark" />
                        {c.phone}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge tone={c.ordersCount > 0 ? "ember" : "neutral"}>
                        {c.ordersCount}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-ash">
                      {c.lastOrderAt ? dateFmt.format(new Date(c.lastOrderAt)) : "—"}
                    </td>
                    <td className="px-3 py-3 text-ash">{dateFmt.format(createdAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <form action={excluirCliente.bind(null, c.id)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir ${c.name}`}
                          title="Excluir cliente"
                          className="text-ash-dark hover:text-danger"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
