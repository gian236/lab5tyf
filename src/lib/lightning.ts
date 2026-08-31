import type {
  LightningReceiveRequest,
  LightningSendRequest,
} from "@tetherto/wdk-wallet-spark";

const RECEIVE_FAILURES = new Set([
  "TRANSFER_CREATION_FAILED",
  "REFUND_SIGNING_COMMITMENTS_QUERYING_FAILED",
  "REFUND_SIGNING_FAILED",
  "PAYMENT_PREIMAGE_RECOVERING_FAILED",
  "TRANSFER_FAILED",
]);

const SEND_FAILURES = new Set([
  "USER_TRANSFER_VALIDATION_FAILED",
  "LIGHTNING_PAYMENT_FAILED",
  "PREIMAGE_PROVIDING_FAILED",
  "TRANSFER_FAILED",
  "USER_SWAP_RETURN_FAILED",
]);

type CurrencyAmount = {
  originalValue: number;
  originalUnit: string;
};

function currencyAmountToSats(amount: CurrencyAmount): number {
  const multipliers: Record<string, number> = {
    BITCOIN: 100_000_000,
    MILLIBITCOIN: 100_000,
    MICROBITCOIN: 100,
    NANOBITCOIN: 0.1,
    SATOSHI: 1,
    MILLISATOSHI: 0.001,
  };
  const multiplier = multipliers[amount.originalUnit];

  if (multiplier === undefined) {
    throw new Error(`Unidad monetaria de WDK no soportada: ${amount.originalUnit}`);
  }

  // Lightning fees may be expressed in millisatoshis; expose whole sats to the API.
  return Math.ceil(amount.originalValue * multiplier);
}

export function receiveStatus(request: LightningReceiveRequest): string {
  if (request.status === "TRANSFER_COMPLETED") return "settled";
  if (RECEIVE_FAILURES.has(request.status)) return "failed";
  if (new Date(request.invoice.expiresAt).getTime() <= Date.now()) return "expired";
  return "pending";
}

export function sendStatus(request: LightningSendRequest): string {
  if (
    request.status === "LIGHTNING_PAYMENT_SUCCEEDED" ||
    request.status === "TRANSFER_COMPLETED"
  ) {
    return "settled";
  }
  if (SEND_FAILURES.has(request.status)) return "failed";
  return "pending";
}

export function serializeReceiveRequest(request: LightningReceiveRequest) {
  return {
    invoiceId: request.id,
    bolt11: request.invoice.encodedInvoice,
    status: receiveStatus(request),
    rawStatus: request.status,
    amountSats: currencyAmountToSats(request.invoice.amount),
    memo: request.invoice.memo ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    expiresAt: request.invoice.expiresAt,
  };
}

export function serializeSendRequest(request: LightningSendRequest) {
  return {
    requestId: request.id,
    paymentId: request.id,
    status: sendStatus(request),
    rawStatus: request.status,
    feeSats: currencyAmountToSats(request.fee),
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}
