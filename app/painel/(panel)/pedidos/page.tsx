import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoard, type KanbanOrder } from "@/components/admin/orders/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const session = await requireSession();

  const [orders, drivers] = await Promise.all([
    prisma.order.findMany({
      where: { storeId: session.storeId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        items: { include: { complements: true } },
        customer: { select: { notes: true } },
      },
    }),
    prisma.driver.findMany({
      where: { storeId: session.storeId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const data: KanbanOrder[] = orders.map((o) => ({
    id: o.id,
    code: o.code,
    type: o.type,
    status: o.status,
    channel: o.channel,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    addressSnapshot: o.addressSnapshot,
    tableNumber: null,
    paymentMethod: o.paymentMethod,
    changeFor: o.changeFor,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    discount: o.discount,
    total: o.total,
    createdAt: o.createdAt.toISOString(),
    driverId: o.driverId,
    customerId: o.customerId,
    customerNotes: o.customer?.notes ?? null,
    items: o.items.map((it) => ({
      id: it.id,
      name: it.name,
      quantity: it.quantity,
      totalPrice: it.totalPrice,
      note: it.note,
      complements: it.complements.map((c) => ({ name: c.name, quantity: c.quantity })),
    })),
  }));

  return <KanbanBoard orders={data} drivers={drivers} />;
}
