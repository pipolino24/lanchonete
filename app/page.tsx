import Link from "next/link";
import { Store, LayoutDashboard, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const store = await prisma.store.findFirst({ select: { slug: true, name: true } });
  const slug = store?.slug ?? "cariri-burguer";

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4">
      <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-ember-500/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Logo variant="stacked" size="lg" />
          <p className="mt-6 max-w-xs text-balance text-ash">
            Gerenciador de pedidos online e presencial — peça pelo cardápio ou
            administre sua hamburgueria.
          </p>
        </div>

        <div className="mt-10 grid gap-3">
          <Link
            href={`/cardapio/${slug}`}
            className="group flex items-center gap-4 rounded-2xl border border-coal-700 bg-coal-850 p-5 transition-colors hover:border-ember-500/50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-ember-500/15 text-ember-400">
              <Store size={22} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-cream">Ver cardápio</span>
              <span className="block text-sm text-ash">Faça seu pedido online</span>
            </span>
            <ArrowRight size={18} className="text-ash transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/painel"
            className="group flex items-center gap-4 rounded-2xl border border-coal-700 bg-coal-850 p-5 transition-colors hover:border-ember-500/50"
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-coal-750 text-cream">
              <LayoutDashboard size={22} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-cream">Painel da loja</span>
              <span className="block text-sm text-ash">Gerencie pedidos, cardápio e caixa</span>
            </span>
            <ArrowRight size={18} className="text-ash transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
