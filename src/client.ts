import type {
  OrbitStreamOptions,
  CreateSessionParams,
  CheckoutSession,
  Payment,
  CreateWebhookParams,
  WebhookEndpoint,
  CreatePaymentLinkParams,
  PaymentLink,
} from './types';

export class OrbitStream {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: OrbitStreamOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.orbitstream.dev';
  }

  // ── Checkout Sessions ──

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
        displayCurrency: params.displayCurrency,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        metadata: params.metadata,
        expiresIn: params.expiresIn,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`OrbitStream: failed to create session — ${err.message}`);
    }

    return res.json();
  }

  async getSession(sessionId: string): Promise<CheckoutSession> {
    const res = await fetch(`${this.baseUrl}/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: session not found');
    }
    return res.json();
  }

  async cancelSession(sessionId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/v1/checkout/sessions/${sessionId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: failed to cancel session');
    }
  }

  // ── Payments ──

  async getSessionPayment(sessionId: string): Promise<Payment> {
    const res = await fetch(`${this.baseUrl}/v1/checkout/sessions/${sessionId}/payment`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: payment not found for session');
    }
    return res.json();
  }

  // ── Payment Links ──

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLink> {
    const res = await fetch(`${this.baseUrl}/v1/payment-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`OrbitStream: failed to create payment link — ${err.message}`);
    }

    return res.json();
  }

  async getPaymentLink(linkId: string): Promise<PaymentLink> {
    const res = await fetch(`${this.baseUrl}/v1/payment-links/${linkId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: payment link not found');
    }
    return res.json();
  }

  async listPaymentLinks(): Promise<PaymentLink[]> {
    const res = await fetch(`${this.baseUrl}/v1/payment-links`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: failed to list payment links');
    }
    return res.json();
  }

  // ── Webhooks ──

  async createWebhook(params: CreateWebhookParams): Promise<WebhookEndpoint> {
    const res = await fetch(`${this.baseUrl}/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`OrbitStream: failed to create webhook — ${err.message}`);
    }

    return res.json();
  }

  async listWebhooks(): Promise<WebhookEndpoint[]> {
    const res = await fetch(`${this.baseUrl}/v1/webhooks`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: failed to list webhooks');
    }
    return res.json();
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: failed to delete webhook');
    }
  }
}
