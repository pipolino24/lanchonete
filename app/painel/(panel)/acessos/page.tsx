import {
  Shield,
  ShieldCheck,
  UserPlus,
  Mail,
  Power,
  Trash2,
  Users,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Card, StatCard, EmptyState } from "@/components/admin/ui";
import { criarUsuario, alternarUsuario, excluirUsuario } from "./actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-lg border border-coal-700 bg-coal-900 px-3 py-2.5 text-sm text-cream placeholder:text-ash-dark focus:border-ember-500 focus:outline-none";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Dono",
  MANAGER: "Gerente",
  STAFF: "Atendente",
};

const ROLE_TONE: Record<string, "ember" | "info" | "neutral"> = {
  OWNER: "ember",
  MANAGER: "info",
  STAFF: "neutral",
};

export default async function AcessosPage() {
  const session = await requireSession();
  const storeId = session.storeId;

  const users = await prisma.user.findMany({
    where: { storeId },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const owners = users.filter((u) => u.role === "OWNER" && u.active).length;

  return (
    <>
      <PageHeader
        title="Controle de acessos"
        subtitle="Gerencie usuários e permissões da sua loja"
      />

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Usuários"
          value={String(totalUsers)}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Ativos"
          value={String(activeUsers)}
          icon={<ShieldCheck size={18} />}
        />
        <StatCard
          label="Donos"
          value={String(owners)}
          hint="Com acesso total"
          icon={<Shield size={18} />}
        />
      </div>

      {/* Novo usuário */}
      <Card className="mt-4">
        <h2 className="mb-3 font-semibold text-cream">Novo usuário</h2>
        <form action={criarUsuario} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ash">Nome</span>
            <input
              name="name"
              required
              placeholder="Nome do usuário"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ash">E-mail</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="email@exemplo.com"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ash">Senha</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ash">Papel</span>
            <select name="role" defaultValue="STAFF" className={inputCls}>
              <option value="OWNER">Dono</option>
              <option value="MANAGER">Gerente</option>
              <option value="STAFF">Atendente</option>
            </select>
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <Button type="submit">
              <UserPlus size={16} />
              Adicionar usuário
            </Button>
          </div>
        </form>
        <p className="mt-2 text-xs text-ash-dark">
          O e-mail precisa ser único. Caso já exista, o usuário não será criado.
        </p>
      </Card>

      {/* Lista de usuários */}
      <Card className="mt-4">
        <h2 className="mb-4 font-semibold text-cream">Usuários da loja</h2>

        {users.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title="Nenhum usuário ainda"
            description="Cadastre o primeiro usuário usando o formulário acima."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-coal-800 text-left text-xs font-medium uppercase tracking-wide text-ash-dark">
                  <th className="px-3 py-2.5 font-medium">Usuário</th>
                  <th className="px-3 py-2.5 font-medium">E-mail</th>
                  <th className="px-3 py-2.5 font-medium">Papel</th>
                  <th className="px-3 py-2.5 text-center font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-coal-800">
                {users.map((u) => {
                  const isSelf = u.id === session.id;
                  return (
                    <tr key={u.id} className={cn("text-cream", !u.active && "opacity-60")}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{u.name}</span>
                          {isSelf && <Badge tone="info">Você</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-ash">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail size={14} className="text-ash-dark" />
                          {u.email}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={ROLE_TONE[u.role] ?? "neutral"}>
                          {ROLE_LABEL[u.role] ?? u.role}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge tone={u.active ? "success" : "neutral"}>
                          {u.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <form action={alternarUsuario.bind(null, u.id)}>
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              disabled={isSelf}
                              aria-label={u.active ? `Desativar ${u.name}` : `Ativar ${u.name}`}
                              title={
                                isSelf
                                  ? "Você não pode alterar seu próprio status"
                                  : u.active
                                    ? "Desativar usuário"
                                    : "Ativar usuário"
                              }
                              className={cn(
                                "text-ash-dark",
                                u.active ? "hover:text-warning" : "hover:text-success",
                              )}
                            >
                              <Power size={16} />
                            </Button>
                          </form>
                          <form action={excluirUsuario.bind(null, u.id)}>
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              disabled={isSelf}
                              aria-label={`Excluir ${u.name}`}
                              title={
                                isSelf
                                  ? "Você não pode excluir a si mesmo"
                                  : "Excluir usuário"
                              }
                              className="text-ash-dark hover:text-danger"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
