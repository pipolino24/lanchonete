"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { loginAction, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-ember-500/10 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Logo variant="stacked" size="lg" />
          <p className="mt-4 text-sm text-ash">Painel da loja</p>
        </div>

        <form
          action={action}
          className="space-y-4 rounded-2xl border border-coal-700 bg-coal-850 p-6 shadow-xl shadow-black/40"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ash">E-mail</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              defaultValue="admin@cariri.com"
              className="w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
              placeholder="voce@loja.com"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ash">Senha</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue="cariri123"
              className="w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" size={18} /> : "Entrar"}
          </Button>

          <p className="text-center text-xs text-ash-dark">
            Demo: admin@cariri.com / cariri123
          </p>
        </form>
      </div>
    </div>
  );
}
