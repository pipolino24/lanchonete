"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, Flame } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { loginAction, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Painel de marca (esquerda) */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-coal-800 p-10 lg:flex">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=70"
            alt=""
            fill
            sizes="50vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-coal-950 via-coal-950/80 to-coal-950/40" />

        <div className="relative">
          <Logo size="md" />
        </div>

        <div className="relative">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ember-400">
            <Flame size={13} fill="currentColor" /> Painel da loja
          </p>
          <h1 className="mt-3 max-w-sm font-display text-4xl font-bold uppercase leading-[0.95] text-cream">
            Gerencie sua brasa, do pedido ao caixa.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-ash">
            Pedidos em tempo real, cardápio, PDV, mesas, entrega e relatórios — tudo
            num lugar só.
          </p>
        </div>

        <p className="relative text-xs text-ash-dark">Feito com 🔥 no Cariri</p>
      </div>

      {/* Formulário (direita) */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo variant="stacked" size="lg" className="mx-auto" />
          </div>

          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-ash hover:text-cream"
          >
            <ArrowLeft size={15} /> Voltar ao site
          </Link>

          <h2 className="font-display text-3xl font-bold text-cream">Bem-vindo de volta</h2>
          <p className="mt-1 text-sm text-ash">Entre para gerenciar sua loja.</p>

          <form action={action} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ash">E-mail</span>
              <input
                name="email"
                type="email"
                autoComplete="username"
                defaultValue="admin@cariri.com"
                className="w-full rounded-lg border border-coal-700 bg-coal-900 px-3.5 py-3 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
                placeholder="voce@loja.com"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-ash">Senha</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue="cariri123"
                className="w-full rounded-lg border border-coal-700 bg-coal-900 px-3.5 py-3 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none"
                placeholder="••••••••"
              />
            </label>

            {state.error && <p className="text-sm text-danger">{state.error}</p>}

            <Button type="submit" size="lg" shimmer className="w-full" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" size={18} /> : "Entrar no painel"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ash-dark">
            Demo: admin@cariri.com · cariri123
          </p>
        </div>
      </div>
    </div>
  );
}
