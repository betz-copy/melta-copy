import {
    IArchiveProcessNotificationMetadata,
    IDateAboutToExpireNotificationMetadata,
    IDeleteProcessNotificationMetadata,
    INewProcessNotificationMetadata,
    INotification,
    IProcessReviewerUpdateNotificationMetadata,
    IProcessStatusUpdateNotificationMetadata,
    IRuleBreachAlertNotificationMetadata,
    IRuleBreachRequestNotificationMetadata,
    IRuleBreachResponseNotificationMetadata,
    NotificationType,
} from '@microservices/shared';

export const isRuleBreachAlertNotification = (
    notification: Partial<INotification>,
): notification is INotification<IRuleBreachAlertNotificationMetadata> => notification.type === NotificationType.ruleBreachAlert;
export const isRuleBreachRequestNotification = (
    notification: Partial<INotification>,
): notification is INotification<IRuleBreachRequestNotificationMetadata> => notification.type === NotificationType.ruleBreachRequest;
export const isRuleBreachResponseNotification = (
    notification: Partial<INotification>,
): notification is INotification<IRuleBreachResponseNotificationMetadata> => notification.type === NotificationType.ruleBreachResponse;
export const isProcessReviewerUpdateNotification = (
    notification: Partial<INotification>,
): notification is INotification<IProcessReviewerUpdateNotificationMetadata> => notification.type === NotificationType.processReviewerUpdate;
export const isProcessStatusUpdateNotification = (
    notification: Partial<INotification>,
): notification is INotification<IProcessStatusUpdateNotificationMetadata> => notification.type === NotificationType.processStatusUpdate;
export const isDeleteProcessNotification = (
    notification: Partial<INotification>,
): notification is INotification<IDeleteProcessNotificationMetadata> => notification.type === NotificationType.deleteProcess;
export const isNewProcessNotification = (notification: Partial<INotification>): notification is INotification<INewProcessNotificationMetadata> =>
    notification.type === NotificationType.newProcess;
export const isArchiveProcessNotification = (
    notification: Partial<INotification>,
): notification is INotification<IArchiveProcessNotificationMetadata> => notification.type === NotificationType.archivedProcess;
export const isDateAboutToExpireNotification = (
    notification: Partial<INotification>,
): notification is INotification<IDateAboutToExpireNotificationMetadata> => notification.type === NotificationType.dateAboutToExpire;
