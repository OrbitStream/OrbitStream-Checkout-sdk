import type {
  StellarCheckoutOptions,
  CreateSessionParams,
  CheckoutSession,
} from './types';

export class StellarCheckout {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: StellarCheckoutOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.stellar-checkout.com';
  }

  async createSession(params: CreateSessionParams): Promise<CheckoutSession> {
    const res = await fetch(`${this.baseUrl}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        asset: params.asset,
        assetIssuer: params.assetIssuer,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        metadata: params.metadata,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`Failed to create session: ${err.message}`);
    }

    return res.json();
  }

  async getSession(sessionId: string): Promise<CheckoutSession> {
    const res = await fetch(`${this.baseUrl}/v1/checkout/sessions/${sessionId}`);
    if (!res.ok) {
      throw new Error('Session not found');
    }
    return res.json();
  }

  async cancelSession(sessionId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/v1/checkout/sessions/${sessionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    if (!res.ok) {
      throw new Error('Failed to cancel session');
    }
  }
}
