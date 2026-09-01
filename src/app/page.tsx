"use client";

import { FormEvent, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import styles from "./page.module.css";

type InvoiceData = {
  invoiceId: string;
  bolt11: string;
  status: string;
  rawStatus: string;
  amountSats: number;
  memo: string | null;
  expiresAt: string;
};

type PaymentData = {
  requestId: string;
  status: string;
  rawStatus: string;
  feeSats: number;
};

type WalletInfo = {
  nodeId: string;
  address: string;
  network: string;
};

async function responseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "La solicitud no se pudo completar");
  return data;
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some browsers reject the Clipboard API even on HTTPS; use the
      // selection-based fallback while the click still has user activation.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    if (!document.execCommand("copy")) {
      throw new Error("El navegador rechazó la copia");
    }
  } finally {
    textarea.remove();
  }
}

export default function Home() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [walletError, setWalletError] = useState("");
  const [amount, setAmount] = useState("1000");
  const [memo, setMemo] = useState("");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [invoiceError, setInvoiceError] = useState("");
  const [creating, setCreating] = useState(false);
  const [bolt11, setBolt11] = useState("");
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const activeInvoiceId = invoice?.invoiceId;
  const activeInvoiceStatus = invoice?.status;

  useEffect(() => {
    const controller = new AbortController();

    async function loadWalletSummary() {
      try {
        const [infoResponse, balanceResponse] = await Promise.all([
          fetch("/api/info", { signal: controller.signal, cache: "no-store" }),
          fetch("/api/balance", { signal: controller.signal, cache: "no-store" }),
        ]);
        const info = await responseJson<WalletInfo>(infoResponse);
        const balanceData = await responseJson<{ balanceSats: number }>(balanceResponse);
        setWalletInfo(info);
        setBalance(balanceData.balanceSats);
      } catch (error) {
        if (!controller.signal.aborted) {
          setWalletError(error instanceof Error ? error.message : "Billetera no disponible");
        }
      }
    }

    void loadWalletSummary();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!activeInvoiceId || !activeInvoiceStatus || ["settled", "failed", "expired"].includes(activeInvoiceStatus)) return;

    const invoiceId = activeInvoiceId;
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout>;

    // Poll WDK every two seconds and stop on a terminal state or unmount.
    async function checkInvoice() {
      try {
        const response = await fetch(
          `/api/check/${encodeURIComponent(invoiceId)}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const current = await responseJson<InvoiceData>(response);
        setInvoice(current);
        if (!["settled", "failed", "expired"].includes(current.status)) {
          timeout = setTimeout(checkInvoice, 2000);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setInvoiceError(error instanceof Error ? error.message : "No se pudo actualizar el estado");
          timeout = setTimeout(checkInvoice, 2000);
        }
      }
    }

    timeout = setTimeout(checkInvoice, 2000);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [activeInvoiceId, activeInvoiceStatus]);

  async function createInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setInvoiceError("");
    setCopyError("");
    setCopied(false);
    setInvoice(null);

    try {
      const response = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountSats: Number(amount), memo }),
      });
      setInvoice(await responseJson<InvoiceData>(response));
    } catch (error) {
      setInvoiceError(error instanceof Error ? error.message : "No se pudo crear la factura");
    } finally {
      setCreating(false);
    }
  }

  async function payInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaying(true);
    setPayment(null);
    setPaymentError("");

    try {
      // WDK and the mnemonic remain server-side while the API executes the payment.
      const response = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bolt11: bolt11.trim() }),
      });
      const result = await responseJson<PaymentData>(response);
      setPayment(result);
      const balanceResponse = await fetch("/api/balance", { cache: "no-store" });
      if (balanceResponse.ok) {
        const balanceData = (await balanceResponse.json()) as { balanceSats: number };
        setBalance(balanceData.balanceSats);
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "No se pudo pagar la factura");
    } finally {
      setPaying(false);
    }
  }

  async function copyInvoice() {
    if (!invoice) return;
    setCopyError("");

    try {
      await copyText(invoice.bolt11);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      setCopyError("No se pudo copiar automáticamente; selecciona el BOLT11 manualmente.");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>LAB 05 · WDK SPARK</span>
          <h1><span>⚡</span> Billetera Lightning</h1>
          <p>Recibe y paga sats sobre Lightning con una billetera WDK real.</p>
        </div>
        <div className={styles.walletBadge}>
          <span className={walletInfo ? styles.onlineDot : styles.offlineDot} />
          <div>
            <small>{walletInfo ? `${walletInfo.network} · CONECTADA` : "BILLETERA"}</small>
            <strong>{balance === null ? "— sats" : `${balance.toLocaleString()} sats`}</strong>
          </div>
        </div>
      </header>

      {walletError && <div className={styles.banner}>{walletError}</div>}

      {walletInfo && (
        <section className={styles.identity}>
          <span>Node ID</span>
          <code title={walletInfo.nodeId}>{walletInfo.nodeId}</code>
          <span>Dirección Spark</span>
          <code title={walletInfo.address}>{walletInfo.address}</code>
        </section>
      )}

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <span className={styles.step}>01</span>
            <div><h2>Recibir</h2><p>Genera una factura Lightning</p></div>
          </div>

          <form onSubmit={createInvoice} className={styles.form}>
            <label htmlFor="amount">Monto en sats</label>
            <div className={styles.amountInput}>
              <input id="amount" type="number" min="1" step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} />
              <span>SATS</span>
            </div>
            <label htmlFor="memo">Memo <small>opcional</small></label>
            <input id="memo" type="text" maxLength={240} placeholder="Pago del Lab 05" value={memo} onChange={(event) => setMemo(event.target.value)} />
            <button type="submit" disabled={creating}>{creating ? "Generando…" : "Generar factura"}</button>
          </form>

          {invoiceError && <p className={styles.error}>{invoiceError}</p>}

          {invoice && (
            <div className={styles.invoiceResult}>
              <div className={styles.statusRow}>
                <span>Estado</span>
                <span className={`${styles.status} ${styles[invoice.status] || ""}`}>
                  <i /> {invoice.status}
                </span>
              </div>
              <div className={styles.qrWrap}>
                <QRCodeSVG value={invoice.bolt11} size={204} level="M" marginSize={2} />
              </div>
              <div className={styles.boltBox}>
                <span>BOLT11</span>
                <code>{invoice.bolt11}</code>
                <button type="button" className={styles.copyButton} onClick={copyInvoice}>{copied ? "Copiado" : "Copiar"}</button>
              </div>
              {copyError && <p className={styles.copyError} role="alert">{copyError}</p>}
              <small className={styles.rawStatus}>WDK: {invoice.rawStatus}</small>
            </div>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeading}>
            <span className={styles.step}>02</span>
            <div><h2>Pagar</h2><p>Envía sats con un BOLT11</p></div>
          </div>

          <form onSubmit={payInvoice} className={styles.form}>
            <label htmlFor="bolt11">Factura BOLT11</label>
            <textarea id="bolt11" required rows={9} spellCheck={false} placeholder="lnbc…" value={bolt11} onChange={(event) => setBolt11(event.target.value)} />
            <div className={styles.warning}>Los pagos Lightning son instantáneos e irreversibles. Verifica la factura antes de pagar.</div>
            <button type="submit" disabled={paying}>{paying ? "Pagando…" : "Pagar factura"}</button>
          </form>

          {paymentError && <p className={styles.error}>{paymentError}</p>}
          {payment && (
            <div className={styles.paymentResult}>
              <span className={`${styles.status} ${styles[payment.status] || ""}`}><i /> {payment.status}</span>
              <div><span>Request ID</span><code>{payment.requestId}</code></div>
              <div><span>Comisión</span><strong>{payment.feeSats.toLocaleString()} sats</strong></div>
              <small className={styles.rawStatus}>WDK: {payment.rawStatus}</small>
            </div>
          )}
        </section>
      </div>

      <footer>Autocustodia con WDK · El mnemonic permanece únicamente en el servidor</footer>
    </main>
  );
}
