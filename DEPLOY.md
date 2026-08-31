# Deploy y evidencia · Lab 05

## Datos públicos

- URL de Vercel: `https://lab5tyf.vercel.app/`
- Network: `REGTEST` (Flashnet)
- Node ID / identity key: `02df6b6a378cc938ca0a9e8a89488591d146e8f3e21fddb9b7ae87858ba7bed80e`
- Dirección Spark: `sparkrt1pgss9hmtdgmcejfceg9faz5ffzzer52xare7y87ahxm6apu93wnmakqw898mud`
- Fecha de verificación local: `2026-08-30 22:25 UTC-06:00`

El Node ID y la dirección se obtienen desde `GET /api/info`; no incluyas aquí la mnemonic ni ninguna otra clave privada.

## Auditoría técnica local WDK ↔ WDK

Esta verificación usó dos cuentas Spark derivadas localmente y confirma el funcionamiento real de las APIs. No sustituye la evidencia obligatoria con un compañero, que debe completarse en las secciones siguientes.

### La aplicación pagó una factura WDK

- Monto: `100 sats`
- Invoice ID: `SparkLightningReceiveRequest:01a05610-4123-cd96-0000-66bb2531792d`
- BOLT11: `lnbcrt1u1p4f2qsupp5y5ue8r2sf73vurrqkmmvaus444fcvghf6rlqsha6jr9d5n87x5sqsp5nysy36u2gh4ca27x0qpz4h7jwlspmm43ge6z7c5h40qwxqp2g9rqxq9z0rgqnp4qtlyk6hxw5h4hrdfdkd4nh2rv0mwyyqvdtakr3dv6m4vvsmfshvg6cqzpudp0f3skygpsx5sxzatyd96zqctswqs8gmeqv93kxmm4de6zqvg9qyyssqvrrjtdghme0rw4mq40hs64q4t9fns20yclpqftl7fpvramyun888njeflfthuqca0fy5u0lzttm7wdpcyjvfe2x8y5k48afwxwlhp9cq89thsa`
- `/api/pay`: `settled`
- Estado crudo de pago y recepción: `TRANSFER_COMPLETED`

### Una segunda cuenta WDK pagó una factura de la aplicación

- Monto: `50 sats`
- Invoice ID: `SparkLightningReceiveRequest:01a05610-5178-cd96-0000-497e32129963`
- BOLT11: `lnbcrt500n1p4f2q3ppp5ncwzlskz3tvvhsq8m6amcyzyqkrtsqpjdqs0smyyp8rmzcjt97vqsp5wfq0h5zd7zegg99tk7dm3hc3wqnhdugnzzyjtvsmlztq5tknvk5sxq9z0rgqnp4qtlyk6hxw5h4hrdfdkd4nh2rv0mwyyqvdtakr3dv6m4vvsmfshvg6cqzpudp0f3skygpsx5sxzatyd96zqctrvdhh2mn5yqcjqar0ypshquq9qyyssqlfdtv90vjawyzsu70ce839r5mxaq2sp6runvravnaqa609wdgnkq7rvykkyt9cd8vevng94v2z4espu3ec3vyym8k4k0q5wpuw4ec4qp87wf7w`
- Pago WDK: `TRANSFER_COMPLETED`
- `/api/check/{invoiceId}`: `settled`
- Estado crudo consultado: `TRANSFER_COMPLETED`
- Comisión estimada: `2 sats`
- Fecha/hora: `2026-08-30 22:25 UTC-06:00`

## Publicación en Vercel

Desde la raíz del proyecto:

```bash
npm run lint
npm run build
vercel env add WDK_MNEMONIC production
vercel env add WDK_NETWORK production
vercel --prod
```

Usa `REGTEST` como valor de `WDK_NETWORK`: es el entorno remoto de pruebas disponible en Spark SDK `0.10.0`. Introduce la mnemonic únicamente en el prompt seguro de Vercel, nunca como argumento del comando ni en un archivo versionado.

Después del deploy, verifica:

1. `GET <URL>/api/info` devuelve el Node ID esperado.
2. `GET <URL>/api/balance` responde correctamente.
3. La UI genera un BOLT11 real y `/api/check/{invoiceId}` cambia a `settled` al pagarse.
4. La UI puede pagar el BOLT11 de otra billetera WDK de la misma red.

## Prueba cruzada #1 · Compañero paga mi factura

- Compañero: `<NOMBRE>`
- Invoice ID: `<PENDIENTE>`
- BOLT11 generado por mi WDK: `<PEGAR BOLT11 COMPLETO>`
- Estado normalizado: `settled`
- Estado crudo WDK: `TRANSFER_COMPLETED`
- Evidencia (captura o enlace): `<PENDIENTE>`
- Fecha/hora: `<PENDIENTE>`

Respuesta final esperada de `GET /api/check/{invoiceId}`:

```json
{
  "invoiceId": "<PENDIENTE>",
  "bolt11": "<PENDIENTE>",
  "status": "settled",
  "rawStatus": "TRANSFER_COMPLETED",
  "amountSats": 0
}
```

Reemplaza `amountSats` por el monto real.

## Prueba cruzada #2 · Yo pago la factura del compañero

- Compañero: `<NOMBRE>`
- BOLT11 generado por la WDK del compañero: `<PEGAR BOLT11 COMPLETO>`
- Request/payment ID devuelto por mi WDK: `<PENDIENTE>`
- Estado normalizado: `settled`
- Estado crudo WDK: `<LIGHTNING_PAYMENT_SUCCEEDED o TRANSFER_COMPLETED>`
- Confirmación `settled` del compañero: `<PENDIENTE>`
- Evidencia (captura o enlace): `<PENDIENTE>`
- Fecha/hora: `<PENDIENTE>`

## Checklist antes de entregar

- [ ] URL pública funcional
- [ ] Variables `WDK_MNEMONIC` y `WDK_NETWORK` configuradas en Production
- [ ] Node ID completado arriba
- [ ] Dos BOLT11 completos documentados
- [ ] Ambas direcciones de la prueba cruzada muestran `settled`
- [ ] Evidencia adjunta
- [ ] `git grep` no encuentra la mnemonic
- [ ] `.env.local` no aparece en `git status`
