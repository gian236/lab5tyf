import { NextResponse } from "next/server";

import { serializeReceiveRequest } from "@/lib/lightning";
import { getWallet, publicErrorMessage } from "@/lib/wallet";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser JSON válido" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "El cuerpo debe ser un objeto JSON" }, { status: 400 });
  }

  const { amountSats: rawAmount, memo: rawMemo } = body as Record<string, unknown>;
  const amountSats = typeof rawAmount === "number" ? rawAmount : Number.NaN;

  if (!Number.isSafeInteger(amountSats) || amountSats <= 0) {
    return NextResponse.json(
      { error: "amountSats debe ser un entero mayor que 0" },
      { status: 400 },
    );
  }

  if (rawMemo !== undefined && typeof rawMemo !== "string") {
    return NextResponse.json({ error: "memo debe ser texto" }, { status: 400 });
  }

  const memo = typeof rawMemo === "string" ? rawMemo.trim() : "";

  try {
    const { account } = await getWallet();
    // WDK creates the real network invoice; no BOLT11 is assembled locally.
    const invoice = await account.createLightningInvoice({
      amountSats,
      ...(memo ? { memo } : {}),
    });

    return NextResponse.json(serializeReceiveRequest(invoice));
  } catch (error) {
    console.error("No se pudo crear la factura Lightning", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "No se pudo crear la factura") },
      { status: 500 },
    );
  }
}
