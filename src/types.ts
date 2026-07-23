// ── Client Configuration ──

export interface OrbitStreamOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
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
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CheckoutSession {
  id: string;
  url: string;
  amount: string;
  asset: string;
  displayAmount?: string;
  memo?: string;
  status: 'pending' | 'processing' | 'paid' | 'expired' | 'cancelled';
  expiresAt: string;
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
