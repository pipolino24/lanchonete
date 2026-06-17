import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ember-500/15 text-2xl">🍔</div>
        <h1 className="mt-4 font-display text-2xl font-bold text-cream">Página não encontrada</h1>
        <p className="mt-2 text-sm text-ash">O que você procura não existe ou foi movido.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-ember-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ember-600/30"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
