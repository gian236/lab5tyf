import "server-only";

import WalletManagerSpark, {
  type NetworkType,
  type WalletAccountSpark,
} from "@tetherto/wdk-wallet-spark";

export type WalletState = {
  wallet: WalletManagerSpark;
  account: WalletAccountSpark;
  network: NetworkType;
};

const SUPPORTED_NETWORKS = new Set<NetworkType>([
  "MAINNET",
  "REGTEST",
]);

declare global {
  // The promise also prevents two simultaneous requests from initializing twice.
  var wdkWalletStatePromise: Promise<WalletState> | undefined;
}

function getNetwork(): NetworkType {
  const value = (process.env.WDK_NETWORK || "REGTEST").trim().toUpperCase();

  if (!SUPPORTED_NETWORKS.has(value as NetworkType)) {
    throw new Error(
      "WDK_NETWORK debe ser REGTEST o MAINNET con WDK Spark 1.0.0-beta.25",
    );
  }

  return value as NetworkType;
}

async function initializeWallet(): Promise<WalletState> {
  const mnemonic = process.env.WDK_MNEMONIC?.trim();

  if (!mnemonic) {
    throw new Error("WDK_MNEMONIC no está configurada");
  }

  const network = getNetwork();
  const wallet = new WalletManagerSpark(mnemonic, {
    network,
    syncAndRetry: true,
  });
  const account = await wallet.getAccount(0);

  return { wallet, account, network };
}

export async function getWallet(): Promise<WalletState> {
  // A warm Node.js/Vercel instance reuses the same logical wallet and account.
  if (!globalThis.wdkWalletStatePromise) {
    globalThis.wdkWalletStatePromise = initializeWallet().catch((error) => {
      // A transient initialization failure may be retried on a later request.
      globalThis.wdkWalletStatePromise = undefined;
      throw error;
    });
  }

  return globalThis.wdkWalletStatePromise;
}

export function publicErrorMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : fallback;
  const mnemonic = process.env.WDK_MNEMONIC?.trim();

  return mnemonic ? raw.replaceAll(mnemonic, "[REDACTED]") : raw;
}
