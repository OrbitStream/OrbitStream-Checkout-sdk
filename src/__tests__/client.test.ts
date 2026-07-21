import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrbitStream } from '../client';

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
      const client = new OrbitStream({
        apiKey: 'sk_test_123',
        baseUrl: 'http://localhost:3001',
      });
      expect(client).toBeDefined();
    });
  });

  describe('amount validation', () => {
    let client: OrbitStream;

    beforeEach(() => {
      client = new OrbitStream({ apiKey: 'sk_test_123' });
    });

    it('should throw on negative amount in createSession', async () => {
      await expect(client.createSession({ amount: -1, asset: 'USDC' })).rejects.toThrow(
        'Amount must be a positive finite number'
      );
    });

    it('should throw on zero amount in createSession', async () => {
      await expect(client.createSession({ amount: 0, asset: 'USDC' })).rejects.toThrow(
        'Amount must be a positive finite number'
      );
    });

    it('should throw on NaN amount in createSession', async () => {
      await expect(client.createSession({ amount: NaN, asset: 'USDC' })).rejects.toThrow(
        'Amount must be a positive finite number'
      );
    });

    it('should throw on Infinity amount in createSession', async () => {
      await expect(client.createSession({ amount: Infinity, asset: 'USDC' })).rejects.toThrow(
        'Amount must be a positive finite number'
      );
    });

    it('should throw on negative amount in createPaymentLink', async () => {
      await expect(client.createPaymentLink({ amount: -5, asset: 'USDC' })).rejects.toThrow(
        'Amount must be a positive finite number'
      );
    });

    it('should throw on non-number amount in createSession', async () => {
      await expect(client.createSession({ amount: '100' as unknown as number, asset: 'USDC' })).rejects.toThrow(
        'Amount must be a positive finite number'
      );
    });
  });

  describe('ID validation', () => {
    let client: OrbitStream;

    beforeEach(() => {
      client = new OrbitStream({ apiKey: 'sk_test_123' });
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
      client = new OrbitStream({ apiKey: 'sk_test_123' });
    });

    it('should parse 401 Unauthorized error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Invalid API key' }), {
          status: 401,
          statusText: 'Unauthorized',
        })
      );

      await expect(client.getSession('sess_123')).rejects.toThrow('401 Invalid API key');
    });

    it('should parse 404 Not Found error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Session not found' }), {
          status: 404,
          statusText: 'Not Found',
        })
      );

      await expect(client.getSession('sess_123')).rejects.toThrow('404 Session not found');
    });

    it('should parse 429 Rate Limited error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Too many requests' }), {
          status: 429,
          statusText: 'Too Many Requests',
        })
      );

      await expect(client.getSession('sess_123')).rejects.toThrow('429 Too many requests');
    });

    it('should parse 500 Internal Server error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Internal error' }), {
          status: 500,
          statusText: 'Internal Server Error',
        })
      );

      await expect(client.getSession('sess_123')).rejects.toThrow('500 Internal error');
    });

    it('should fall back to statusText when JSON parse fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Not JSON', {
          status: 403,
          statusText: 'Forbidden',
        })
      );

      await expect(client.getSession('sess_123')).rejects.toThrow('403 Forbidden');
    });

    it('should handle errors in cancelSession', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Cannot cancel' }), {
          status: 400,
          statusText: 'Bad Request',
        })
      );

      await expect(client.cancelSession('sess_123')).rejects.toThrow('400 Cannot cancel');
    });

    it('should handle errors in getSessionPayment', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'No payment' }), {
          status: 404,
          statusText: 'Not Found',
        })
      );

      await expect(client.getSessionPayment('sess_123')).rejects.toThrow('404 No payment');
    });

    it('should handle errors in getPaymentLink', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Link not found' }), {
          status: 404,
          statusText: 'Not Found',
        })
      );

      await expect(client.getPaymentLink('link_123')).rejects.toThrow('404 Link not found');
    });

    it('should handle errors in deleteWebhook', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Webhook not found' }), {
          status: 404,
          statusText: 'Not Found',
        })
      );

      await expect(client.deleteWebhook('wh_123')).rejects.toThrow('404 Webhook not found');
    });
  });
});
