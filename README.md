# OrbitStream SDK

**Stripe-like checkout for the Stellar network.**

Accept USDC, EURC, and XLM payments with a developer-friendly SDK. 5-second finality, $0.00001 fees, native fiat rails via Stellar anchors and MoneyGram.

## Install

```bash
npm install @orbitstream/sdk @stellar/stellar-sdk
```

## Quick Start

```ts
import { OrbitStream } from '@orbitstream/sdk';

const orbit = new OrbitStream({ apiKey: 'sk_test_...' });

// Create a checkout session
const session = await orbit.createSession({
  amount: 25.0,
  asset: 'USDC',
  displayCurrency: 'USD',
  successUrl: 'https://yoursite.com/success',
  cancelUrl: 'https://yoursite.com/cancel',
});

// Redirect customer to session.url
```

## Features

| Feature | Status |
|---|---|
| Checkout sessions | ✅ |
| Hosted checkout page | ✅ |
| Multi-asset (USDC, EURC, XLM) | ✅ |
| Webhooks | ✅ |
| Payment links | ✅ |
| Embeddable widget | 🔜 |
| Merchant dashboard | 🔜 |
| Subscriptions (Soroban) | 🔜 |

## API

### `new OrbitStream(options)`

```ts
const orbit = new OrbitStream({
  apiKey: 'sk_test_...',       // required
  baseUrl: 'https://...',      // optional, defaults to OrbitStream API
});
```

### Checkout Sessions

```ts
// Create
const session = await orbit.createSession({ amount, asset, ... });

// Retrieve
const session = await orbit.getSession(sessionId);

// Cancel
await orbit.cancelSession(sessionId);

// Get payment details
const payment = await orbit.getSessionPayment(sessionId);
```

### Payment Links

```ts
const link = await orbit.createPaymentLink({
  amount: 10,
  asset: 'USDC',
  description: 'Coffee subscription',
});

// Share link.url with customers — no code required
```

### Webhooks

```ts
const webhook = await orbit.createWebhook({
  url: 'https://yoursite.com/webhooks/orbitstream',
  events: ['payment.confirmed', 'session.expired'],
});

const all = await orbit.listWebhooks();
await orbit.deleteWebhook(webhook.id);
```

## Supported Assets

| Asset | Code | Stellar Type |
|---|---|---|
| USD Coin | `USDC` | Stellar asset (issuer required) |
| Euro Coin | `EURC` | Stellar asset (issuer required) |
| Stellar Lumens | `XLM` | Native |

## Stellar Integration

OrbitStream is built on Stellar's native infrastructure:

- **SEP-10** — Authentication via Stellar account ownership
- **SEP-24** — Fiat on/off ramps via anchor iframe
- **Muxed accounts** — Unique payment addresses per checkout session
- **Claimable balances** — Escrow-like flows without smart contracts
- **Built-in DEX** — Auto-convert between Stellar assets

## Examples

See [`examples/basic.html`](examples/basic.html) for a browser integration.

## License

MIT
