import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  unreadOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === 'true'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export const notificationTypeSchema = z.enum([
  'ORDER_STATUS_CHANGED',
  'ORDER_CANCELLED',
  'PRODUCT_REVIEW_RECEIVED',
  'CREATOR_APPLICATION_STATUS',
  'CREATOR_DOCUMENT_REVIEWED',
  'LOW_STOCK_ALERT',
  'GENERAL',
]);

/** Internal — created by other modules' Service Layers (Orders, Creators, Reviews), never directly from a Route Handler body. */
export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: notificationTypeSchema.default('GENERAL'),
  title: z.string().trim().min(1).max(255),
  body: z.string().trim().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
});
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
