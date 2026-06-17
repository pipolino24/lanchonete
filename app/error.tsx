"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ember-500/15 text-2xl">🔥</div>
        <h1 className="mt-4 font-display text-2xl font-bold text-cream">Algo deu errado</h1>
        <p className="mt-2 text-sm text-ash">
          Tivemos um probleminha ao carregar esta página. Tente de novo.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-ember-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ember-600/30"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
