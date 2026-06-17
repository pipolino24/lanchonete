import { NextResponse } from "next/server";
import { getProductDetail } from "@/lib/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // ObjectId do Mongo = 24 hex; id malformado faria o Prisma lançar P2023 (500)
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
  try {
    const product = await getProductDetail(id);
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
}
