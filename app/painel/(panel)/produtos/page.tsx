import Link from "next/link";
import { Package, Plus, Star, Pencil } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { NovaCategoria } from "@/components/admin/produtos/NovaCategoria";
import { criarCategoria } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const session = await requireSession();

  const categories = await prisma.category.findMany({
    where: { storeId: session.storeId },
    orderBy: { position: "asc" },
    include: {
      products: {
        orderBy: { position: "asc" },
      },
    },
  });

  const totalProducts = categories.reduce((sum, c) => sum + c.products.length, 0);

  return (
    <>
      <PageHeader
        title="Produtos"
        subtitle="Gerencie o cardápio da sua loja por categorias."
        actions={
          <>
            <NovaCategoria action={criarCategoria} />
            <Link href="/painel/produtos/editar/novo">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Novo produto
              </Button>
            </Link>
          </>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="Nenhuma categoria ainda"
          description="Crie sua primeira categoria para começar a montar o cardápio."
        />
      ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category.id}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-cream">
                  {category.emoji ? `${category.emoji} ` : ""}
                  {category.name}
                </h2>
                <Badge tone="neutral">{category.products.length}</Badge>
                {!category.active && <Badge tone="warning">Categoria oculta</Badge>}
              </div>

              {category.products.length === 0 ? (
                <p className="rounded-xl border border-dashed border-coal-700 px-4 py-6 text-sm text-ash-dark">
                  Nenhum produto nesta categoria.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex flex-col rounded-2xl border border-coal-800 bg-coal-900/60 p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-medium leading-tight text-cream">{product.name}</h3>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {product.featured && (
                            <Badge tone="ember">
                              <Star className="h-3 w-3" />
                              Destaque
                            </Badge>
                          )}
                          {!product.active && <Badge tone="neutral">Indisponível</Badge>}
                        </div>
                      </div>

                      {product.description && (
                        <p className="mb-3 line-clamp-2 text-xs text-ash">{product.description}</p>
                      )}

                      <div className="mt-auto flex items-end justify-between gap-2">
                        <div>
                          {product.promoPrice != null ? (
                            <div className="flex items-baseline gap-2">
                              <span className="font-display text-lg font-bold text-ember-400">
                                {formatPrice(product.promoPrice)}
                              </span>
                              <span className="text-xs text-ash-dark line-through">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-display text-lg font-bold text-cream">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>

                        <Link href={`/painel/produtos/editar/${product.id}`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {categories.length > 0 && (
        <p className="mt-8 text-xs text-ash-dark">
          {categories.length} categoria(s) · {totalProducts} produto(s)
        </p>
      )}
    </>
  );
}
