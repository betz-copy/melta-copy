import {
    IArchiveProcessNotificationMetadataPopulated,
    IDateAboutToExpireMetadataPopulated,
    IDeleteProcessNotificationMetadataPopulated,
    INewProcessNotificationMetadataPopulated,
    INotificationPopulated,
    IProcessReviewerUpdateNotificationMetadataPopulated,
    IProcessStatusUpdateNotificationMetadataPopulated,
    IRuleBreachAlertNotificationMetadataPopulated,
    IRuleBreachRequestNotificationMetadataPopulated,
    IRuleBreachResponseNotificationMetadataPopulated,
    NotificationType,
} from '@packages/notification';

export const isDeleteProcessNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IDeleteProcessNotificationMetadataPopulated> => {
    return notification.type === NotificationType.deleteProcess;
};
export const isArchiveProcessNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IArchiveProcessNotificationMetadataPopulated> => {
    return notification.type === NotificationType.archivedProcess;
};
export const isRuleBreachAlertNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IRuleBreachAlertNotificationMetadataPopulated> => {
    return notification.type === NotificationType.ruleBreachAlert;
};

export const isRuleBreachRequestNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IRuleBreachRequestNotificationMetadataPopulated> => {
    return notification.type === NotificationType.ruleBreachRequest;
};
export const isRuleBreachResponseNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IRuleBreachResponseNotificationMetadataPopulated> => {
    return notification.type === NotificationType.ruleBreachResponse;
};

export const isProcessReviewerUpdateNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IProcessReviewerUpdateNotificationMetadataPopulated> =>
    notification.type === NotificationType.processReviewerUpdate;
export const isProcessStatusUpdateNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IProcessStatusUpdateNotificationMetadataPopulated> =>
    notification.type === NotificationType.processStatusUpdate;
export const isNewProcessNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<INewProcessNotificationMetadataPopulated> => notification.type === NotificationType.newProcess;

export const isDateAboutToExpireNotification = (
    notification: Partial<INotificationPopulated>,
): notification is INotificationPopulated<IDateAboutToExpireMetadataPopulated> => notification.type === NotificationType.dateAboutToExpire;
