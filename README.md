# Lab 05 · Billetera Lightning con WDK

Aplicación Next.js + TypeScript para crear, consultar y pagar facturas Lightning reales con `@tetherto/wdk-wallet-spark`. La billetera vive exclusivamente en el servidor y reutiliza una instancia singleton mientras la función de Node.js permanece activa.

## Requisitos

- Node.js 20 o superior
- Una mnemonic BIP-39 propia
- Fondos en la red Spark seleccionada para realizar pagos

## Instalación

```bash
npm install
Copy-Item .env.example .env.local
```

Configura `.env.local`:

```dotenv
WDK_MNEMONIC="tu mnemonic BIP-39"
WDK_NETWORK=REGTEST
```

No uses `NEXT_PUBLIC_` para la mnemonic. Todos los archivos `.env*`, salvo `.env.example`, están ignorados por Git.

Inicia el proyecto:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para verificar la versión de producción:

```bash
npm run lint
npm run build
npm start
```

## API

### `POST /api/invoice`

```json
{ "amountSats": 1000, "memo": "Prueba Lab 05" }
```

Devuelve `invoiceId`, `bolt11`, `status`, `rawStatus` y `amountSats`. `status` se normaliza a `pending`, `settled`, `failed` o `expired`; `rawStatus` conserva el estado exacto de WDK.

### `GET /api/check/{invoiceId}`

Consulta la factura real en WDK. Devuelve `404` si no existe.

### `POST /api/pay`

```json
{ "bolt11": "ln..." }
```

WDK estima primero la comisión, usa esa estimación como límite explícito y ejecuta el pago. Devuelve el `requestId`, estado y comisión.

### `GET /api/info`

Devuelve únicamente datos públicos: `nodeId`/`identityKey`, dirección Spark y red.

### `GET /api/balance`

Devuelve `{ "balanceSats": number }`.

## Persistencia y seguridad

`src/lib/wallet.ts` almacena una promesa de inicialización en `globalThis`. Así, las solicitudes concurrentes y posteriores de una instancia caliente reutilizan el mismo `WalletManagerSpark` y la misma cuenta. En un cold start de Vercel se reconstruye la instancia en memoria, pero la misma mnemonic deriva la misma billetera lógica; nunca se genera una mnemonic nueva.

La mnemonic solo se lee desde `process.env.WDK_MNEMONIC`, no se envía al cliente ni se imprime. En Vercel debe guardarse como variable de entorno cifrada. El valor predeterminado de `WDK_NETWORK` es `REGTEST`.

> Compatibilidad: WDK Spark `1.0.0-beta.25` usa Spark SDK `0.10.0`, que solo incluye endpoints públicos para `REGTEST` (Flashnet) y `MAINNET`. Aunque el tipo del SDK enumera `TESTNET`, esa opción cae en la configuración `LOCAL` y trata de conectarse a `localhost`; por eso no se usa para el deploy del laboratorio.

Consulta [DEPLOY.md](./DEPLOY.md) para publicar y documentar las pruebas cruzadas obligatorias.
