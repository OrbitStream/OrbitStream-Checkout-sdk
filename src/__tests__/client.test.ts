import { describe, it, expect } from 'vitest';
import { OrbitStream } from '../client';

describe('OrbitStream', () => {
  it('should be defined', () => {
    expect(OrbitStream).toBeDefined();
  });

  it('should create client with empty API key', () => {
    const client = new OrbitStream({ apiKey: '' });
    expect(client).toBeDefined();
  });

  it('should create client with default baseUrl', () => {
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
