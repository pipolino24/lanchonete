import { Bike, MapPin, Truck, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatAmount } from "@/lib/money";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ToggleButton, DeleteButton } from "@/components/admin/entrega/RowActions";
import {
  salvarConfigEntrega,
  criarFaixa,
  excluirFaixa,
  alternarFaixa,
  criarEntregador,
  excluirEntregador,
  alternarEntregador,
} from "./actions";

export const dynamic = "force-dynamic";

const INPUT =
  "w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none";

const MODE_LABEL: Record<string, string> = {
  KM: "Por distância (km)",
  NEIGHBORHOOD: "Por bairro",
  FIXED: "Taxa fixa",
};

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-ash">{children}</span>;
}

export default async function EntregaPage() {
  const session = await requireSession();
  const storeId = session.storeId;

  const [store, zones, drivers] = await Promise.all([
    prisma.store.findUnique({
      where: { id: storeId },
      select: { deliveryMode: true, prepTime: true, freeShippingAbove: true },
    }),
    prisma.deliveryZone.findMany({
      where: { storeId },
      orderBy: [{ position: "asc" }, { fee: "asc" }],
    }),
    prisma.driver.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
    }),
  ]);

  const deliveryMode = store?.deliveryMode ?? "KM";
  const prepTime = store?.prepTime ?? 40;
  const freeShippingAbove = store?.freeShippingAbove ?? null;

  const isKm = deliveryMode === "KM";
  const isNeighborhood = deliveryMode === "NEIGHBORHOOD";
  const isFixed = deliveryMode === "FIXED";

  // No modo FIXED existe apenas uma taxa fixa. Se já houver uma faixa, escondemos o formulário.
  const fixedZoneExists = isFixed && zones.length > 0;

  const firstColLabel = isKm ? "Faixa" : isNeighborhood ? "Bairro" : "Taxa fixa";
  const zonesTitle = isNeighborhood ? "Bairros atendidos" : isFixed ? "Taxa de entrega" : "Faixas de entrega";

  return (
    <>
      <PageHeader
        title="Entrega"
        subtitle="Configure o modo de entrega, faixas de taxa e seus entregadores"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Seção 1 — Configurações */}
        <Card className="lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Truck size={18} className="text-ember-400" />
            <h2 className="font-semibold text-cream">Configurações</h2>
          </div>

          <form action={salvarConfigEntrega} className="space-y-4">
            <label className="block">
              <Label>Modo de entrega</Label>
              <select name="deliveryMode" defaultValue={deliveryMode} className={INPUT}>
                <option value="KM">{MODE_LABEL.KM}</option>
                <option value="NEIGHBORHOOD">{MODE_LABEL.NEIGHBORHOOD}</option>
                <option value="FIXED">{MODE_LABEL.FIXED}</option>
              </select>
            </label>

            <label className="block">
              <Label>Tempo de preparo (min)</Label>
              <input
                type="number"
                name="prepTime"
                min={0}
                step={1}
                defaultValue={prepTime}
                placeholder="40"
                className={INPUT}
              />
            </label>

            <label className="block">
              <Label>Frete grátis acima de (R$)</Label>
              <input
                type="text"
                inputMode="decimal"
                name="freeShippingAbove"
                defaultValue={freeShippingAbove != null ? formatAmount(freeShippingAbove) : ""}
                placeholder="Deixe vazio para desativar"
                className={INPUT}
              />
              <span className="mt-1 block text-xs text-ash-dark">
                Vazio = frete grátis desativado.
              </span>
            </label>

            <Button type="submit" className="w-full">
              Salvar configurações
            </Button>
          </form>
        </Card>

        {/* Seção 2 — Faixas de entrega */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-ember-400" />
            <h2 className="font-semibold text-cream">{zonesTitle}</h2>
            <Badge tone="neutral">{MODE_LABEL[deliveryMode]}</Badge>
          </div>

          {zones.length === 0 ? (
            <EmptyState
              icon={<MapPin size={28} />}
              title={
                isNeighborhood
                  ? "Nenhum bairro cadastrado"
                  : isFixed
                    ? "Taxa fixa não definida"
                    : "Nenhuma faixa cadastrada"
              }
              description={
                isNeighborhood
                  ? "Adicione os bairros que você atende com taxa e prazo de entrega."
                  : isFixed
                    ? "Defina uma única taxa fixa de entrega com seu prazo."
                    : "Adicione faixas com taxa e prazo para cobrir suas regiões de atendimento."
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-coal-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-coal-850 text-xs uppercase text-ash-dark">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">{firstColLabel}</th>
                    {isKm && <th className="px-3 py-2.5 font-medium">Até (km)</th>}
                    <th className="px-3 py-2.5 font-medium">Taxa</th>
                    <th className="px-3 py-2.5 font-medium">Prazo</th>
                    <th className="px-3 py-2.5 text-center font-medium">Ativa</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-coal-800">
                  {zones.map((z) => (
                    <tr key={z.id} className="text-cream">
                      <td className="px-3 py-2.5 font-medium">
                        {isFixed
                          ? "Taxa fixa"
                          : (z.label ?? <span className="text-ash">Sem nome</span>)}
                      </td>
                      {isKm && (
                        <td className="px-3 py-2.5 text-ash">
                          {z.maxKm != null ? `${z.maxKm} km` : "—"}
                        </td>
                      )}
                      <td className="px-3 py-2.5 font-semibold text-ember-400">
                        {formatPrice(z.fee)}
                      </td>
                      <td className="px-3 py-2.5 text-ash">{z.etaMinutes} min</td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-center">
                          <ToggleButton
                            active={z.active}
                            onToggle={alternarFaixa.bind(null, z.id)}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <DeleteButton onDelete={excluirFaixa.bind(null, z.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {fixedZoneExists ? (
            <p className="mt-4 rounded-xl border border-coal-800 bg-coal-900/40 p-4 text-xs text-ash-dark">
              No modo de taxa fixa existe apenas uma taxa. Para alterar, exclua a taxa
              atual e cadastre uma nova.
            </p>
          ) : (
            <form
              action={criarFaixa}
              className="mt-4 grid gap-3 rounded-xl border border-coal-800 bg-coal-900/40 p-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              {isNeighborhood && (
                <label className="block lg:col-span-2">
                  <Label>Bairro</Label>
                  <input
                    type="text"
                    name="label"
                    required
                    placeholder="Centro"
                    className={INPUT}
                  />
                </label>
              )}
              {isKm && (
                <>
                  <label className="block lg:col-span-2">
                    <Label>Nome da faixa</Label>
                    <input type="text" name="label" placeholder="Centro" className={INPUT} />
                  </label>
                  <label className="block">
                    <Label>Até (km)</Label>
                    <input
                      type="text"
                      inputMode="decimal"
                      name="maxKm"
                      placeholder="5"
                      className={INPUT}
                    />
                  </label>
                </>
              )}
              <label className="block">
                <Label>Taxa (R$)</Label>
                <input
                  type="text"
                  inputMode="decimal"
                  name="fee"
                  placeholder="8,00"
                  className={INPUT}
                />
              </label>
              <label className="block">
                <Label>Prazo (min)</Label>
                <input
                  type="number"
                  name="etaMinutes"
                  min={0}
                  step={1}
                  placeholder="30"
                  className={INPUT}
                />
              </label>
              <div className="sm:col-span-2 lg:col-span-5">
                <Button type="submit" variant="secondary" size="sm">
                  <Plus size={16} />{" "}
                  {isNeighborhood
                    ? "Adicionar bairro"
                    : isFixed
                      ? "Definir taxa fixa"
                      : "Adicionar faixa"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>

      {/* Seção 3 — Entregadores */}
      <Card className="mt-4">
        <div className="mb-4 flex items-center gap-2">
          <Bike size={18} className="text-ember-400" />
          <h2 className="font-semibold text-cream">Entregadores</h2>
        </div>

        {drivers.length === 0 ? (
          <EmptyState
            icon={<Bike size={28} />}
            title="Nenhum entregador cadastrado"
            description="Cadastre seus entregadores para atribuí-los aos pedidos de delivery."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-coal-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-coal-850 text-xs uppercase text-ash-dark">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Nome</th>
                  <th className="px-3 py-2.5 font-medium">Telefone</th>
                  <th className="px-3 py-2.5 text-center font-medium">Status</th>
                  <th className="px-3 py-2.5 text-center font-medium">Ativo</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-coal-800">
                {drivers.map((d) => (
                  <tr key={d.id} className="text-cream">
                    <td className="px-3 py-2.5 font-medium">{d.name}</td>
                    <td className="px-3 py-2.5 text-ash">{d.phone ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center">
                        <Badge tone={d.active ? "success" : "neutral"}>
                          {d.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center">
                        <ToggleButton
                          active={d.active}
                          onToggle={alternarEntregador.bind(null, d.id)}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <DeleteButton onDelete={excluirEntregador.bind(null, d.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form
          action={criarEntregador}
          className="mt-4 grid gap-3 rounded-xl border border-coal-800 bg-coal-900/40 p-4 sm:grid-cols-3"
        >
          <label className="block sm:col-span-1">
            <Label>Nome</Label>
            <input type="text" name="name" required placeholder="João Silva" className={INPUT} />
          </label>
          <label className="block sm:col-span-1">
            <Label>Telefone</Label>
            <input type="text" name="phone" placeholder="(88) 99999-0000" className={INPUT} />
          </label>
          <div className="flex items-end sm:col-span-1">
            <Button type="submit" variant="secondary" size="sm">
              <Plus size={16} /> Adicionar entregador
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
