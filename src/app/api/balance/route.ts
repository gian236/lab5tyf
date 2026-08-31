import { NextResponse } from "next/server";

import { getWallet, publicErrorMessage } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { account } = await getWallet();
    const balance = await account.getBalance();

    return NextResponse.json({ balanceSats: Number(balance) });
  } catch (error) {
    console.error("No se pudo consultar el saldo", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "No se pudo consultar el saldo") },
      { status: 500 },
    );
  }
}
