import { NextResponse } from "next/server";

import { serializeReceiveRequest } from "@/lib/lightning";
import { getWallet, publicErrorMessage } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const { invoiceId: rawInvoiceId } = await params;
  const invoiceId = rawInvoiceId.trim();

  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId es requerido" }, { status: 400 });
  }

  try {
    const { account } = await getWallet();
    const invoice = await account.getLightningReceiveRequest(invoiceId);

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    return NextResponse.json(serializeReceiveRequest(invoice));
  } catch (error) {
    console.error("No se pudo consultar la factura Lightning", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "No se pudo consultar la factura") },
      { status: 500 },
    );
  }
}
