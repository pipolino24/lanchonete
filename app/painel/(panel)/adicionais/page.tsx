import { PlusSquare } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { GrupoCard, type GrupoView } from "@/components/admin/adicionais/GrupoCard";
import { NovoGrupoButton } from "@/components/admin/adicionais/GrupoForm";

export const dynamic = "force-dynamic";

export default async function AdicionaisPage() {
  const session = await requireSession();

  const grupos = await prisma.complementGroup.findMany({
    where: { storeId: session.storeId },
    orderBy: { position: "asc" },
    include: {
      items: { orderBy: { position: "asc" } },
    },
  });

  const data: GrupoView[] = grupos.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    active: g.active,
    items: g.items.map((it) => ({
      id: it.id,
      name: it.name,
      description: it.description,
      price: it.price,
    })),
  }));

  return (
    <>
      <PageHeader
        title="Adicionais"
        subtitle="Grupos de complementos reutilizáveis nos produtos"
        actions={<NovoGrupoButton />}
      />

      {data.length === 0 ? (
        <EmptyState
          icon={<PlusSquare size={36} />}
          title="Nenhum grupo de adicionais"
          description="Crie grupos como 'Adicionais do burger' ou 'Escolha o ponto da carne' para vincular aos seus produtos."
          action={<NovoGrupoButton />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((g) => (
            <GrupoCard key={g.id} grupo={g} />
          ))}
        </div>
      )}
    </>
  );
}
