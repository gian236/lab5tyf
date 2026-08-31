import { NextResponse } from "next/server";

import { getWallet, publicErrorMessage } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { account, network } = await getWallet();
    const [nodeId, address] = await Promise.all([
      account.getIdentityKey(),
      account.getAddress(),
    ]);

    return NextResponse.json({ nodeId, identityKey: nodeId, address, network });
  } catch (error) {
    console.error("No se pudo consultar la información pública", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "No se pudo consultar la billetera") },
      { status: 500 },
    );
  }
}
