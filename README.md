# 🔥 Cariri Burguer

Gerenciador de pedidos **online e presencial** para hamburgueria — cardápio digital para o cliente + painel de operação para a loja. Inspirado no fluxo do cardapio.ai, com **layout próprio** (tema escuro "smokehouse"), **desktop de verdade no PC** e **versão mobile no celular**.

## ✨ Funcionalidades

### Cliente (cardápio online)
- Vitrine responsiva (grid largo no desktop, coluna única no mobile)
- Categorias, destaques e busca
- Modal de produto com **adicionais/complementos**, **remoção de ingredientes**, observação e quantidade
- Carrinho + checkout completo: Delivery / Retirada, identificação, endereço, cupom e pagamento (Dinheiro com troco, Pix, Crédito, Débito)

### Painel da loja
- Login com sessão (JWT em cookie httpOnly)
- **Início** (dashboard com métricas)
- **Pedidos** — Kanban (Novos → Em preparo → Saiu p/ entrega → Concluídos), abas por tipo, avançar status, detalhe
- **PDV / Nova venda** e **Mesas** (atendimento no salão)
- **Produtos** (categorias, tipos Comum/Combo/Pizza/Peso, destaque, canais, adicionais) e **Adicionais** (grupos reutilizáveis)
- **Clientes**, **Cupons**, **Entrega** (faixas/frete/entregadores), **Pagamento**, **Horários**, **Caixa**, **Relatórios**, **QR Code**, **Minha loja**

> Fora de escopo: emissão fiscal (NFC-e) e integrações de terceiros.

## 🧱 Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (tema escuro quente customizado)
- **Prisma 6** + **MongoDB** (Atlas)
- Auth com **jose** (JWT) + **bcryptjs**; estado do carrinho com **zustand**

## 🚀 Como rodar

Pré-requisitos: Node 20+ e um banco MongoDB (Atlas grátis ou local).

```bash
# 1) Dependências
npm install

# 2) Crie o .env (veja abaixo) e sincronize o banco
npx prisma db push
npm run db:seed
npx tsx prisma/seed-orders.ts   # pedidos de demonstração (opcional)

# 3) App
npm run dev
```

Crie um `.env` baseado em `.env.example`:

```env
DATABASE_URL="mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/cariri?retryWrites=true&w=majority"
AUTH_SECRET="uma_string_aleatoria_longa"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🔑 Acesso (demo)

- Cardápio: `http://localhost:3000/cardapio/cariri-burguer`
- Painel: `http://localhost:3000/painel` — **admin@cariri.com** / **cariri123**

## 📁 Estrutura

```
app/
  cardapio/[slug]/      # vitrine do cliente
  painel/               # painel da loja (login + (panel)/*)
  api/                  # rotas de API (produtos, pedidos)
components/
  store/                # componentes do cardápio
  admin/                # componentes do painel
  ui/  brand/           # design system + identidade
lib/                    # prisma, auth, money, orders, queries, cart-store
prisma/                 # schema + seeds
docs/                   # análise/spec de funcionalidades
```
