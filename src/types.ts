// ── Client Configuration ──

export interface OrbitStreamOptions {
  apiKey: string;
  baseUrl?: string;
}

// ── Supported Stellar Assets ──

export type StellarAssetCode = 'USDC' | 'EURC' | 'XLM';

export interface AssetOption {
  code: StellarAssetCode;
  issuer?: string; // not required for XLM
}

// ── Checkout Sessions ──

export interface CreateSessionParams {
  amount: number;
  asset: StellarAssetCode;
  assetIssuer?: string;
  displayCurrency?: string; // fiat currency for display (e.g. "USD", "EUR", "ARS")
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, unknown>;
  expiresIn?: number; // seconds until session expires, default 1800 (30 min)
}

export interface CheckoutSession {
  id: string;
  url: string;
  amount: string;
  asset: string;
  displayAmount?: string;
  displayCurrency?: string;
  paymentAddress: string; // Stellar address to receive payment
  memo?: string; // muxed memo for payment matching
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
}

// ── Payments ──

export interface Payment {
  id: string;
  sessionId: string;
  txHash: string;
  amount: string;
  asset: string;
  sender: string;
  confirmedAt: string;
}

// ── Webhooks ──

export type WebhookEventType =
  | 'payment.confirmed'
  | 'payment.failed'
  | 'session.created'
  | 'session.expired'
  | 'session.cancelled';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  createdAt: string;
  data: {
    sessionId: string;
    payment?: Payment;
    session?: CheckoutSession;
  };
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  active: boolean;
  createdAt: string;
}

export interface CreateWebhookParams {
  url: string;
  events: WebhookEventType[];
}

// ── Payment Links ──

export interface CreatePaymentLinkParams {
  amount: number;
  asset: StellarAssetCode;
  assetIssuer?: string;
  description?: string;
  displayCurrency?: string;
  metadata?: Record<string, unknown>;
  expiresIn?: number; // seconds, null = never expires
}

export interface PaymentLink {
  id: string;
  url: string;
  amount: string;
  asset: string;
  description?: string;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

// ── Events / Callbacks ──

export interface CheckoutCallbacks {
  onPaymentConfirmed?: (payment: Payment) => void;
  onPaymentFailed?: (error: string) => void;
  onSessionExpired?: () => void;
  onCancelled?: () => void;
}
