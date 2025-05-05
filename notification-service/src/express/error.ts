import { ServiceError, NotificationType } from '@microservices/shared';
import { StatusCodes } from 'http-status-codes';

export class NotificationDoesNotExistError extends ServiceError {
    constructor(notificationId: string) {
        super(StatusCodes.NOT_FOUND, `A notification with the id '${notificationId}' does not exist`);
    }
}

/* istanbul ignore next */
export class InvalidNotificationTypeError extends ServiceError {
    constructor(type: NotificationType) {
        super(StatusCodes.NOT_FOUND, `'${type} is not a valid notification type`);
    }
}
