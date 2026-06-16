import Link from "next/link";
import { ArrowRight, MessageCircle, MapPin, Clock, Flame } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Marquee } from "@/components/ui/Marquee";
import { ProductImage } from "@/components/store/ProductImage";
import { prisma } from "@/lib/prisma";
import { isOpenNow } from "@/lib/store-hours";
import { formatPrice } from "@/lib/money";

export const dynamic = "force-dynamic";

function waLink(whatsapp?: string | null) {
  if (!whatsapp) return null;
  let d = whatsapp.replace(/\D/g, "");
  if (!d.startsWith("55")) d = `55${d}`;
  return `https://wa.me/${d}`;
}

export default async function Home() {
  const store = await prisma.store.findFirst({ include: { hours: true } });
  const slug = store?.slug ?? "cariri-burguer";
  const featured = store
    ? await prisma.product.findMany({
        where: { storeId: store.id, active: true, featured: true },
        take: 8,
      })
    : [];
  const heroProducts = store
    ? await prisma.product.findMany({
        where: { storeId: store.id, active: true, images: { isEmpty: false } },
        take: 12,
        orderBy: { featured: "desc" },
      })
    : [];
  const open = store ? isOpenNow(store.hours) : false;
  const hero = featured[0] ?? heroProducts[0];
  const wa = waLink(store?.whatsapp);
  const cityLine = store?.city ? `${store.neighborhood ? store.neighborhood + " · " : ""}${store.city}${store.state ? "-" + store.state : ""}` : "Crato-CE";

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Cabeçalho — logo à esquerda, ações à direita (nada centralizado) */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Logo size="sm" />
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/painel" className="link-ember hidden text-ash hover:text-cream sm:inline">
            Painel da loja
          </Link>
          <Link href={`/cardapio/${slug}`}>
            <Button size="sm">Ver cardápio</Button>
          </Link>
        </nav>
      </header>

      {/* HERO editorial assimétrico */}
      <main className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:pb-20 lg:pt-10">
        {/* Texto */}
        <div className="order-2 lg:order-1">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-coal-700 bg-coal-850/70 px-3 py-1 text-xs font-medium uppercase tracking-widest text-ash">
              <Flame size={13} className="text-ember-500" fill="currentColor" /> Hamburgueria artesanal · {cityLine}
            </span>
          </Reveal>

          <Reveal variant="blur" delay={80}>
            <h1 className="mt-5 font-display text-[3.25rem] font-bold uppercase leading-[0.92] tracking-tight text-cream sm:text-7xl lg:text-[5.5rem]">
              Feito na
              <br />
              <span className="text-ember-500">brasa</span>, do
              <br />
              jeito que vicia.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-ash">
              Pão brioche na chapa, carne de 180g no ponto e aquele cheddar inglês
              derretendo. Peça pelo cardápio e receba quentinho — ou retire na loja.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={`/cardapio/${slug}`}>
                <Button size="lg" shimmer className="gap-2">
                  Ver cardápio <ArrowRight size={18} />
                </Button>
              </Link>
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline" className="gap-2">
                    <MessageCircle size={18} /> WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ash">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${open ? "bg-success" : "bg-danger"}`} />
                {open ? "Aberto agora" : "Fechado no momento"}
              </span>
              {store && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-ash-dark" /> {store.street ? `${store.street}, ${store.number ?? ""}` : cityLine}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-ash-dark" /> Pedido mínimo {formatPrice(store?.minOrder ?? 500)}
              </span>
            </div>
          </Reveal>
        </div>

        {/* Imagem + card flutuante sobreposto */}
        <Reveal variant="right" className="order-1 lg:order-2">
          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] ring-1 ring-coal-700 sm:aspect-[5/4] lg:aspect-[4/5]">
              <div className="absolute inset-0 animate-slow-zoom">
                <ProductImage src={store?.coverUrl ?? hero?.images?.[0]} alt={store?.name ?? "Cariri Burguer"} emoji="🔥" sizes="(max-width:1024px) 100vw, 50vw" priority />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-coal-950 via-transparent to-coal-950/30" />
              <div className="absolute inset-0 bg-gradient-to-tr from-flame-600/20 via-transparent to-transparent" />
            </div>

            {/* Card de destaque sobreposto (quebra a simetria) */}
            {hero && (
              <Link
                href={`/cardapio/${slug}`}
                className="border-beam-wrap surface absolute -bottom-5 -left-3 flex w-56 items-center gap-3 rounded-2xl p-2.5 shadow-warm transition-transform hover:-translate-y-1 sm:-left-6"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-coal-700">
                  <ProductImage src={hero.images?.[0]} alt={hero.name} sizes="64px" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-ember-400">Carro-chefe</p>
                  <p className="truncate text-sm font-semibold text-cream">{hero.name}</p>
                  <p className="text-sm font-bold text-ember-400">{formatPrice(hero.promoPrice ?? hero.price)}</p>
                </div>
              </Link>
            )}

            {/* Selo girado (textura de marca, não AI) */}
            <div className="absolute -right-2 top-5 hidden rotate-6 rounded-xl bg-ember-500 px-3 py-2 text-center font-display text-xs font-bold uppercase leading-tight text-white shadow-lg shadow-ember-600/40 sm:block">
              Na<br />brasa
            </div>
          </div>
        </Reveal>
      </main>

      {/* Faixa em marquee — vira "vitrine viva" e tira a cara de página estática */}
      {heroProducts.length > 0 && (
        <section className="border-y border-coal-800 bg-coal-900/40 py-5">
          <Marquee speed={42}>
            {heroProducts.map((p) => (
              <Link
                key={p.id}
                href={`/cardapio/${slug}`}
                className="group flex w-60 shrink-0 items-center gap-3 rounded-2xl border border-coal-800 bg-coal-850 p-2.5 transition-colors hover:border-ember-500/40"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-coal-700">
                  <ProductImage src={p.images?.[0]} alt={p.name} sizes="56px" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-cream">{p.name}</p>
                  <p className="text-sm font-bold text-ember-400">{formatPrice(p.promoPrice ?? p.price)}</p>
                </div>
              </Link>
            ))}
          </Marquee>
        </section>
      )}

      {/* Rodapé com info real (menos genérico) */}
      <footer className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 border-t border-coal-800 pt-8 sm:flex-row sm:items-center">
          <div>
            <Logo size="sm" />
            <p className="mt-3 max-w-xs text-sm text-ash">
              {store?.street ? `${store.street}, ${store.number ?? ""} — ${cityLine}` : cityLine}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:items-end">
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="link-ember text-ash hover:text-cream">
                {store?.whatsapp}
              </a>
            )}
            <Link href="/painel" className="link-ember text-ash hover:text-cream">
              Painel da loja
            </Link>
            <p className="text-xs text-ash-dark">Feito com 🔥 no Cariri</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
