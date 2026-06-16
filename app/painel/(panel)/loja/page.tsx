import { ExternalLink } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/money";
import { PageHeader, Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { CopyLink } from "@/components/admin/loja/CopyLink";
import { salvarLoja } from "./actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none";
const labelCls = "mb-1 block text-xs font-medium text-ash";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

export default async function LojaPage() {
  const session = await requireSession();
  const store = await prisma.store.findUniqueOrThrow({ where: { id: session.storeId } });
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const menuUrl = `${base}/cardapio/${store.slug}`;

  return (
    <>
      <PageHeader title="Minha loja" subtitle="Dados, identidade visual e chave Pix." />

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-ash-dark">Link do seu cardápio</p>
          <p className="font-medium text-cream">{menuUrl || `/cardapio/${store.slug}`}</p>
        </div>
        <div className="flex gap-2">
          <CopyLink url={menuUrl || `/cardapio/${store.slug}`} />
          <a href={`/cardapio/${store.slug}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink size={15} /> Abrir
            </Button>
          </a>
        </div>
      </Card>

      <form action={salvarLoja} className="space-y-4">
        <Card>
          <h2 className="mb-3 font-semibold text-cream">Dados da loja</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome">
              <input name="name" defaultValue={store.name} className={inputCls} />
            </Field>
            <Field label="CNPJ / CPF">
              <input name="document" defaultValue={store.document ?? ""} className={inputCls} placeholder="Opcional" />
            </Field>
            <Field label="WhatsApp">
              <input name="whatsapp" defaultValue={store.whatsapp ?? ""} className={inputCls} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="Pedido mínimo (R$)">
              <input name="minOrder" defaultValue={formatAmount(store.minOrder)} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-cream">Identidade visual</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cor primária">
              <div className="flex items-center gap-2">
                <input type="color" name="primaryColor" defaultValue={store.primaryColor} className="h-10 w-14 cursor-pointer rounded-lg border border-coal-700 bg-coal-900" />
                <span className="text-sm text-ash">{store.primaryColor}</span>
              </div>
            </Field>
            <div className="hidden sm:block" />
            <Field label="URL do logo">
              <input name="logoUrl" defaultValue={store.logoUrl ?? ""} className={inputCls} placeholder="https://..." />
            </Field>
            <Field label="URL da capa">
              <input name="coverUrl" defaultValue={store.coverUrl ?? ""} className={inputCls} placeholder="https://..." />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-cream">Endereço</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CEP">
              <input name="zipCode" defaultValue={store.zipCode ?? ""} className={inputCls} />
            </Field>
            <Field label="Rua">
              <input name="street" defaultValue={store.street ?? ""} className={inputCls} />
            </Field>
            <Field label="Número">
              <input name="number" defaultValue={store.number ?? ""} className={inputCls} />
            </Field>
            <Field label="Bairro">
              <input name="neighborhood" defaultValue={store.neighborhood ?? ""} className={inputCls} />
            </Field>
            <Field label="Cidade">
              <input name="city" defaultValue={store.city ?? ""} className={inputCls} />
            </Field>
            <Field label="Estado (UF)">
              <input name="state" defaultValue={store.state ?? ""} className={inputCls} maxLength={2} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-cream">Pix</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Chave Pix">
              <input name="pixKey" defaultValue={store.pixKey ?? ""} className={inputCls} />
            </Field>
            <Field label="Tipo da chave">
              <select name="pixKeyType" defaultValue={store.pixKeyType ?? ""} className={inputCls}>
                <option value="">—</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="EMAIL">E-mail</option>
                <option value="PHONE">Telefone</option>
                <option value="RANDOM">Aleatória</option>
              </select>
            </Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </>
  );
}
