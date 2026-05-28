export interface StellarCheckoutOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface CreateSessionParams {
  amount: number;
  asset: string;
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
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expiresAt: string;
}

export interface Payment {
  txHash: string;
  amount: string;
  asset: string;
  sender: string;
}
