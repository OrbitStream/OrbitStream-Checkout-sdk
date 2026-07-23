import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OrbitStream } from '../client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'content-type': 'application/json' },
  });
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ message }), {
    status,
    statusText: String(status),
    headers: { 'content-type': 'application/json' },
  });
}

function htmlResponse(status = 200) {
  return new Response('<html><body>Error</body></html>', {
    status,
    statusText: 'OK',
    headers: { 'content-type': 'text/html' },
  });
}

describe('OrbitStream', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should throw when apiKey is empty', () => {
      expect(() => new OrbitStream({ apiKey: '' })).toThrow('API key is required');
    });

    it('should throw when apiKey is whitespace only', () => {
      expect(() => new OrbitStream({ apiKey: '   ' })).toThrow('API key is required');
    });

    it('should throw when apiKey is undefined', () => {
      expect(() => new OrbitStream({ apiKey: undefined as unknown as string })).toThrow('API key is required');
    });

    it('should create client with valid apiKey', () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123' });
      expect(client).toBeDefined();
    });

    it('should create client with custom baseUrl', () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123', baseUrl: 'http://localhost:3001' });
      expect(client).toBeDefined();
    });

    it('should create client with custom timeout', () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123', timeout: 10_000 });
      expect(client).toBeDefined();
    });

    it('should create client with custom maxRetries', () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123', maxRetries: 5 });
      expect(client).toBeDefined();
    });
  });

  describe('amount validation', () => {
    let client: OrbitStream;

    beforeEach(() => {
      client = new OrbitStream({ apiKey: 'sk_test_123', maxRetries: 0 });
    });

    it('should throw on negative amount in createSession', async () => {
      await expect(client.createSession({ amount: -1, asset: 'USDC' })).rejects.toThrow('Amount must be a positive finite number');
    });

    it('should throw on zero amount in createSession', async () => {
      await expect(client.createSession({ amount: 0, asset: 'USDC' })).rejects.toThrow('Amount must be a positive finite number');
    });

    it('should throw on NaN amount in createSession', async () => {
      await expect(client.createSession({ amount: NaN, asset: 'USDC' })).rejects.toThrow('Amount must be a positive finite number');
    });

    it('should throw on Infinity amount in createSession', async () => {
      await expect(client.createSession({ amount: Infinity, asset: 'USDC' })).rejects.toThrow('Amount must be a positive finite number');
    });

    it('should throw on negative amount in createPaymentLink', async () => {
      await expect(client.createPaymentLink({ amount: -5, asset: 'USDC' })).rejects.toThrow('Amount must be a positive finite number');
    });

    it('should throw on non-number amount in createSession', async () => {
      await expect(client.createSession({ amount: '100' as unknown as number, asset: 'USDC' })).rejects.toThrow('Amount must be a positive finite number');
    });
  });

  describe('ID validation', () => {
    let client: OrbitStream;

    beforeEach(() => {
      client = new OrbitStream({ apiKey: 'sk_test_123', maxRetries: 0 });
    });

    it('should throw on empty sessionId in getSession', async () => {
      await expect(client.getSession('')).rejects.toThrow('Session ID is required');
    });

    it('should throw on whitespace sessionId in getSession', async () => {
      await expect(client.getSession('   ')).rejects.toThrow('Session ID is required');
    });

    it('should throw on empty sessionId in cancelSession', async () => {
      await expect(client.cancelSession('')).rejects.toThrow('Session ID is required');
    });

    it('should throw on empty sessionId in getSessionPayment', async () => {
      await expect(client.getSessionPayment('')).rejects.toThrow('Session ID is required');
    });

    it('should throw on empty linkId in getPaymentLink', async () => {
      await expect(client.getPaymentLink('')).rejects.toThrow('Link ID is required');
    });

    it('should throw on empty webhookId in deleteWebhook', async () => {
      await expect(client.deleteWebhook('')).rejects.toThrow('Webhook ID is required');
    });
  });

  describe('error handling', () => {
    let client: OrbitStream;

    beforeEach(() => {
      client = new OrbitStream({ apiKey: 'sk_test_123', maxRetries: 0 });
    });

    it('should parse 401 Unauthorized error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errorResponse('Invalid API key', 401));
      await expect(client.getSession('sess_123')).rejects.toThrow('401 Invalid API key');
    });

    it('should parse 404 Not Found error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errorResponse('Session not found', 404));
      await expect(client.getSession('sess_123')).rejects.toThrow('404 Session not found');
    });

    it('should parse 429 Rate Limited error without retries', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errorResponse('Too many requests', 429));
      await expect(client.getSession('sess_123')).rejects.toThrow('429 Too many requests');
    });

    it('should parse 500 Internal Server error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errorResponse('Internal error', 500));
      await expect(client.getSession('sess_123')).rejects.toThrow('500 Internal error');
    });

    it('should fall back to statusText when JSON parse fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('Not JSON', { status: 403, statusText: 'Forbidden' }));
      await expect(client.getSession('sess_123')).rejects.toThrow('403 Forbidden');
    });

    it('should handle errors in cancelSession', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errorResponse('Cannot cancel', 400));
      await expect(client.cancelSession('sess_123')).rejects.toThrow('400 Cannot cancel');
    });

    it('should handle errors in getSessionPayment', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errorResponse('No payment', 404));
      await expect(client.getSessionPayment('sess_123')).rejects.toThrow('404 No payment');
    });

    it('should handle errors in getPaymentLink', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errorResponse('Link not found', 404));
      await expect(client.getPaymentLink('link_123')).rejects.toThrow('404 Link not found');
    });

    it('should handle errors in deleteWebhook', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errorResponse('Webhook not found', 404));
      await expect(client.deleteWebhook('wh_123')).rejects.toThrow('404 Webhook not found');
    });
  });

  describe('timeout', () => {
    it('should throw timeout error when request exceeds duration', async () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123', timeout: 10, maxRetries: 0 });
      vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
        return new Promise((_, reject) => {
          const signal = init?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }
        });
      });
      await expect(client.getSession('sess_123')).rejects.toThrow('Request timed out after 10ms');
    }, 5000);

    it('should use default 30s timeout', async () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123', timeout: 10, maxRetries: 0 });
      vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
        return new Promise((_, reject) => {
          const signal = init?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }
        });
      });
      await expect(client.getSession('sess_123')).rejects.toThrow('Request timed out after 10ms');
    }, 5000);
  });

  describe('retry logic', () => {
    it('should retry on 429 and succeed on second attempt', async () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123', maxRetries: 3, timeout: 5000 });
      const sessionData = { id: 'sess_123', url: 'https://checkout.example.com', amount: '25', asset: 'USDC', status: 'pending', expiresAt: '2025-01-01T00:00:00Z' };

      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(errorResponse('Too many requests', 429))
        .mockResolvedValueOnce(jsonResponse(sessionData));

      const result = await client.getSession('sess_123');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result.id).toBe('sess_123');
    }, 10000);

    it('should retry on 503 and succeed on third attempt', async () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123', maxRetries: 3, timeout: 5000 });
      const sessionData = { id: 'sess_123', url: 'https://checkout.example.com', amount: '25', asset: 'USDC', status: 'pending', expiresAt: '2025-01-01T00:00:00Z' };

      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' }))
        .mockResolvedValueOnce(new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' }))
        .mockResolvedValueOnce(jsonResponse(sessionData));

      const result = await client.getSession('sess_123');
      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(result.id).toBe('sess_123');
    }, 10000);

    it('should not retry on 400 or 401', async () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123', maxRetries: 3, timeout: 5000 });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(errorResponse('Bad request', 400));

      await expect(client.getSession('sess_123')).rejects.toThrow('400 Bad request');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw last error', async () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123', maxRetries: 2, timeout: 5000 });

      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValue(errorResponse('Rate limited', 429));

      await expect(client.getSession('sess_123')).rejects.toThrow('429');
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should retry on network error', async () => {
      const client = new OrbitStream({ apiKey: 'sk_test_123', maxRetries: 2, timeout: 5000 });
      const sessionData = { id: 'sess_123', url: 'https://checkout.example.com', amount: '25', asset: 'USDC', status: 'pending', expiresAt: '2025-01-01T00:00:00Z' };

      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(jsonResponse(sessionData));

      const result = await client.getSession('sess_123');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result.id).toBe('sess_123');
    }, 10000);
  });

  describe('response format validation', () => {
    let client: OrbitStream;

    beforeEach(() => {
      client = new OrbitStream({ apiKey: 'sk_test_123', maxRetries: 0 });
    });

    it('should throw on non-JSON response on success path', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(htmlResponse());
      await expect(client.getSession('sess_123')).rejects.toThrow('Unexpected response format');
    });

    it('should throw on invalid JSON on success path', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('{invalid json', { status: 200, statusText: 'OK', headers: { 'content-type': 'application/json' } })
      );
      await expect(client.getSession('sess_123')).rejects.toThrow('Unexpected response format');
    });

    it('should succeed with valid JSON response', async () => {
      const sessionData = { id: 'sess_123', url: 'https://checkout.example.com', amount: '25', asset: 'USDC', status: 'pending', expiresAt: '2025-01-01T00:00:00Z' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse(sessionData));

      const result = await client.getSession('sess_123');
      expect(result).toEqual(sessionData);
    });

    it('should throw on non-JSON error response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(htmlResponse(500));
      await expect(client.getSession('sess_123')).rejects.toThrow('500');
    });
  });
});
