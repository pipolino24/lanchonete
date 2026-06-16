import { Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Card } from "@/components/admin/ui";
import { salvarHorario } from "./actions";

export const dynamic = "force-dynamic";

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const inputClass =
  "w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none";

export default async function HorariosPage() {
  const session = await requireSession();

  const hours = await prisma.businessHour.findMany({
    where: { storeId: session.storeId },
    orderBy: { weekday: "asc" },
  });

  const byWeekday = new Map(hours.map((h) => [h.weekday, h]));

  return (
    <>
      <PageHeader
        title="Horários de funcionamento"
        subtitle="Defina os horários de abertura e fechamento de cada dia da semana."
      />

      <div className="grid gap-3">
        {WEEKDAYS.map((label, weekday) => {
          const current = byWeekday.get(weekday);
          const isActive = current?.active ?? false;
          const openTime = current?.openTime ?? "18:00";
          const closeTime = current?.closeTime ?? "23:00";

          return (
            <Card key={weekday} className="p-4 sm:p-5">
              <form
                action={salvarHorario}
                className="flex flex-col gap-4 sm:flex-row sm:items-end"
              >
                <input type="hidden" name="weekday" value={weekday} />

                <div className="flex items-center gap-3 sm:w-44 sm:shrink-0">
                  <Clock className="h-4 w-4 text-ember-400" aria-hidden />
                  <div>
                    <p className="font-display text-sm font-semibold text-cream">{label}</p>
                    {isActive ? (
                      <Badge tone="success">Aberto</Badge>
                    ) : (
                      <Badge tone="neutral">Fechado</Badge>
                    )}
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-xs">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ash">Abre</span>
                    <input
                      type="time"
                      name="openTime"
                      defaultValue={openTime}
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-ash">Fecha</span>
                    <input
                      type="time"
                      name="closeTime"
                      defaultValue={closeTime}
                      className={inputClass}
                    />
                  </label>
                </div>

                <label className="flex cursor-pointer items-center gap-2 sm:pb-2.5">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={isActive}
                    className="h-4 w-4 rounded border-coal-700 bg-coal-900 accent-ember-500 focus:outline-none"
                  />
                  <span className="text-xs font-medium text-ash">Ativo</span>
                </label>

                <Button type="submit" variant="secondary" size="sm" className="sm:pb-0">
                  Salvar
                </Button>
              </form>
            </Card>
          );
        })}
      </div>
    </>
  );
}
