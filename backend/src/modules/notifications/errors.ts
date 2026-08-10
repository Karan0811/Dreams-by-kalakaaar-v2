import { NotFoundError } from '@/shared/errors/base-errors';

export class NotificationNotFoundError extends NotFoundError {
  constructor() {
    super('Notification not found.');
  }
}
