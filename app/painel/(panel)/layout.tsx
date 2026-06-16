import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const store = await prisma.store.findUnique({ where: { id: session.storeId } });

  return (
    <div className="min-h-screen">
      <Sidebar storeName={store?.name ?? "Loja"} userName={session.name} />
      <div className="pl-64">
        <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
