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
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(options: OrbitStreamOptions) {
    if (!options.apiKey || options.apiKey.trim() === '') {
      throw new Error('OrbitStream: API key is required');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://api.orbitstream.dev';
    this.timeout = options.timeout ?? 30_000;
    this.maxRetries = options.maxRetries ?? 3;
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

  private isRetryable(status: number): boolean {
    return status === 429 || status === 503;
  }

  private async requestWithRetry(url: string, init: RequestInit): Promise<Response> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        clearTimeout(timer);
        if (res.ok || !this.isRetryable(res.status)) {
          return res;
        }
        const parsed = await this.parseError(res, 'request failed');
        lastError = parsed;
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 200));
        }
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error(`OrbitStream: Request timed out after ${this.timeout}ms`);
        }
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 200));
        }
      }
    }
    throw lastError;
  }

  private async parseResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error('OrbitStream: Unexpected response format');
    }
    try {
      return await res.json() as T;
    } catch {
      throw new Error('OrbitStream: Unexpected response format');
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
    const res = await this.requestWithRetry(`${this.baseUrl}/v1/checkout/sessions`, {
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
      throw await this.parseError(res, 'failed to create session');
    }

    return this.parseResponse<CheckoutSession>(res);
  }

  async getSession(sessionId: string): Promise<CheckoutSession> {
    this.validateId(sessionId, 'Session ID');
    const res = await this.requestWithRetry(`${this.baseUrl}/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw await this.parseError(res, 'failed to get session');
    }
    return this.parseResponse<CheckoutSession>(res);
  }

  async cancelSession(sessionId: string): Promise<void> {
    this.validateId(sessionId, 'Session ID');
    const res = await this.requestWithRetry(`${this.baseUrl}/v1/checkout/sessions/${sessionId}/cancel`, {
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
    const res = await this.requestWithRetry(`${this.baseUrl}/v1/checkout/sessions/${sessionId}/payment`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw await this.parseError(res, 'failed to get payment');
    }
    return this.parseResponse<Payment>(res);
  }

  // ── Payment Links ──

  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLink> {
    this.validateAmount(params.amount);
    const res = await this.requestWithRetry(`${this.baseUrl}/v1/payment-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw await this.parseError(res, 'failed to create payment link');
    }

    return this.parseResponse<PaymentLink>(res);
  }

  async getPaymentLink(linkId: string): Promise<PaymentLink> {
    this.validateId(linkId, 'Link ID');
    const res = await this.requestWithRetry(`${this.baseUrl}/v1/payment-links/${linkId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw await this.parseError(res, 'failed to get payment link');
    }
    return this.parseResponse<PaymentLink>(res);
  }

  async listPaymentLinks(): Promise<PaymentLink[]> {
    const res = await this.requestWithRetry(`${this.baseUrl}/v1/payment-links`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: failed to list payment links');
    }
    return this.parseResponse<PaymentLink[]>(res);
  }

  // ── Webhooks ──

  async createWebhook(params: CreateWebhookParams): Promise<WebhookEndpoint> {
    const res = await this.requestWithRetry(`${this.baseUrl}/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw await this.parseError(res, 'failed to create webhook');
    }

    return this.parseResponse<WebhookEndpoint>(res);
  }

  async listWebhooks(): Promise<WebhookEndpoint[]> {
    const res = await this.requestWithRetry(`${this.baseUrl}/v1/webhooks`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw new Error('OrbitStream: failed to list webhooks');
    }
    return this.parseResponse<WebhookEndpoint[]>(res);
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    this.validateId(webhookId, 'Webhook ID');
    const res = await this.requestWithRetry(`${this.baseUrl}/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) {
      throw await this.parseError(res, 'failed to delete webhook');
    }
  }
}
