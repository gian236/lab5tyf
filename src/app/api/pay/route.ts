import { NextResponse } from "next/server";

import { serializeSendRequest } from "@/lib/lightning";
import { getWallet, publicErrorMessage } from "@/lib/wallet";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser JSON válido" }, { status: 400 });
  }

  const bolt11 =
    body && typeof body === "object" && typeof (body as Record<string, unknown>).bolt11 === "string"
      ? ((body as Record<string, unknown>).bolt11 as string).trim()
      : "";

  if (!bolt11) {
    return NextResponse.json({ error: "bolt11 es requerido" }, { status: 400 });
  }

  if (!bolt11.toLowerCase().startsWith("ln")) {
    return NextResponse.json({ error: "bolt11 no parece una factura Lightning válida" }, { status: 400 });
  }

  try {
    const { account } = await getWallet();
    const feeEstimate = await account.quotePayLightningInvoice({ encodedInvoice: bolt11 });
    const maxFeeSats = Number(feeEstimate);

    if (!Number.isSafeInteger(maxFeeSats) || maxFeeSats < 0) {
      throw new Error("WDK devolvió una estimación de comisión inválida");
    }

    // The quote becomes the explicit fee ceiling required by this WDK beta.
    const payment = await account.payLightningInvoice({
      invoice: bolt11,
      maxFeeSats,
    });

    return NextResponse.json({
      ...serializeSendRequest(payment),
      estimatedFeeSats: maxFeeSats,
    });
  } catch (error) {
    console.error("No se pudo pagar la factura Lightning", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "No se pudo pagar la factura") },
      { status: 500 },
    );
  }
}
