import { describe, expect, it } from 'vitest';
import { createNotificationSchema, listNotificationsQuerySchema } from '../schemas';

describe('createNotificationSchema', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000';

  it('defaults type to GENERAL', () => {
    const result = createNotificationSchema.parse({ userId, title: 'Hi', body: 'Hello there' });
    expect(result.type).toBe('GENERAL');
  });

  it('accepts a specific type and data payload', () => {
    const result = createNotificationSchema.parse({
      userId,
      type: 'ORDER_STATUS_CHANGED',
      title: 'Order update',
      body: 'Your order shipped',
      data: { orderId: '456' },
    });
    expect(result.type).toBe('ORDER_STATUS_CHANGED');
    expect(result.data).toEqual({ orderId: '456' });
  });

  it('rejects an empty title', () => {
    expect(createNotificationSchema.safeParse({ userId, title: '', body: 'x' }).success).toBe(false);
  });
});

describe('listNotificationsQuerySchema', () => {
  it('defaults unreadOnly to false and applies pagination defaults', () => {
    const result = listNotificationsQuerySchema.parse({});
    expect(result.unreadOnly).toBe(false);
    expect(result.limit).toBe(20);
  });

  it('parses unreadOnly=true from a query string value', () => {
    const result = listNotificationsQuerySchema.parse({ unreadOnly: 'true' });
    expect(result.unreadOnly).toBe(true);
  });
});
