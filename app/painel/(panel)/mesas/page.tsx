import Link from "next/link";
import { Armchair } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { definirMesas } from "./actions";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MesasPage() {
  const session = await requireSession();
  const tables = await prisma.restaurantTable.findMany({
    where: { storeId: session.storeId },
    orderBy: { number: "asc" },
  });

  const free = tables.filter((t) => t.status === "FREE").length;
  const occupied = tables.filter((t) => t.status === "OCCUPIED").length;

  return (
    <>
      <PageHeader
        title="Mesas"
        subtitle="Atendimento no salão. Toque numa mesa livre para abrir um pedido."
        actions={
          <form action={definirMesas} className="flex items-center gap-2">
            <span className="text-xs text-ash">Nº de mesas</span>
            <input
              name="quantidade"
              type="number"
              min={0}
              max={200}
              defaultValue={tables.length}
              className="w-20 rounded-lg border border-coal-700 bg-coal-900 px-3 py-2 text-sm text-cream focus:border-ember-500 focus:outline-none"
            />
            <Button type="submit" size="sm" variant="secondary">
              Aplicar
            </Button>
          </form>
        }
      />

      <div className="mb-4 flex gap-2">
        <Badge tone="success">Livres: {free}</Badge>
        <Badge tone="ember">Ocupadas: {occupied}</Badge>
      </div>

      {tables.length === 0 ? (
        <EmptyState
          icon={<Armchair size={36} />}
          title="Nenhuma mesa cadastrada"
          description="Defina o número de mesas no campo acima para começar."
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {tables.map((t) => {
            const occupiedTable = t.status === "OCCUPIED";
            return (
              <Link
                key={t.id}
                href={`/painel/pdv?table=${t.number}&type=DINEIN`}
                className={cn(
                  "surface grid aspect-square place-items-center rounded-2xl text-center transition-all hover:-translate-y-0.5 hover:border-ember-500/40",
                  occupiedTable && "border-ember-500/40 bg-ember-500/10",
                )}
              >
                <div>
                  <Armchair
                    size={22}
                    className={cn("mx-auto mb-1", occupiedTable ? "text-ember-400" : "text-ash")}
                  />
                  <p className="font-display text-xl font-bold text-cream">{t.number}</p>
                  <p className={cn("text-[10px]", occupiedTable ? "text-ember-400" : "text-ash-dark")}>
                    {occupiedTable ? "Ocupada" : "Livre"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
