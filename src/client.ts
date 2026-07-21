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
    if (!options.apiKey || options.apiKey.trim() === '') {
      throw new Error('OrbitStream: API key is required');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.orbitstream.dev';
  }

  private validateAmount(amount: number): void {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('OrbitStream: Amount must be a positive finite number');
    }
  }

  private validateId(id: string, paramName: string): void {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error(`OrbitStream: ${paramName} is required`);
    }
  }

  private async parseError(res: Response, context: string): Promise<Error> {
    try {
      const body = await res.json();
      return new Error(`OrbitStream: ${context} — ${res.status} ${body.message || res.statusText}`);
    } catch {
      return new Error(`OrbitStream: ${context} — ${res.status} ${res.statusText}`);
    }
  }

  // ── Checkout Sessions ──

  async createSession(params: CreateSessionParams): Promise<CheckoutSession> {
    this.validateAmount(params.amount);
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
      throw new Error(`OrbitStream: failed to create session — ${err.message}`);
    }

    return await res.json();
  }

  async getSession(sessionId: string): Promise<CheckoutSession> {
    this.validateId(sessionId, 'Session ID');
    const res = await fetch(`${this.baseUrl}/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw await this.parseError(res, 'failed to get session');
    }
    return await res.json();
  }

  async cancelSession(sessionId: string): Promise<void> {
    this.validateId(sessionId, 'Session ID');
    const res = await fetch(`${this.baseUrl}/v1/checkout/sessions/${sessionId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw await this.parseError(res, 'failed to cancel session');
    }
  }

  // ── Payments ──

  async getSessionPayment(sessionId: string): Promise<Payment> {
    this.validateId(sessionId, 'Session ID');
    const res = await fetch(`${this.baseUrl}/v1/checkout/sessions/${sessionId}/payment`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw await this.parseError(res, 'failed to get payment');
    }
    return await res.json();
  }

  // ── Payment Links ──

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLink> {
    this.validateAmount(params.amount);
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

    return await res.json();
  }

  async getPaymentLink(linkId: string): Promise<PaymentLink> {
    this.validateId(linkId, 'Link ID');
    const res = await fetch(`${this.baseUrl}/v1/payment-links/${linkId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw await this.parseError(res, 'failed to get payment link');
    }
    return await res.json();
  }

  async listPaymentLinks(): Promise<PaymentLink[]> {
    const res = await fetch(`${this.baseUrl}/v1/payment-links`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: failed to list payment links');
    }
    return await res.json();
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

    return await res.json();
  }

  async listWebhooks(): Promise<WebhookEndpoint[]> {
    const res = await fetch(`${this.baseUrl}/v1/webhooks`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: failed to list webhooks');
    }
    return await res.json();
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    this.validateId(webhookId, 'Webhook ID');
    const res = await fetch(`${this.baseUrl}/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw await this.parseError(res, 'failed to delete webhook');
    }
  }
}
