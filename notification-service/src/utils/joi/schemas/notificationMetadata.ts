import { INotification, NotificationType } from '@packages/notification';
import { Status } from '@packages/process';
import * as joi from 'joi';
import { mongoIdSchema } from '.';

export const ruleBreachAlertMetadataSchema = joi.object({
    alertId: mongoIdSchema.required(),
});
export const ruleBreachRequestMetadataSchema = joi.object({
    requestId: mongoIdSchema.required(),
});
export const ruleBreachResponseMetadataSchema = joi.object({
    requestId: mongoIdSchema.required(),
});

export const processReviewerUpdateMetadataSchema = joi.object({
    processId: mongoIdSchema.required(),
    addedStepIds: joi.array().items(mongoIdSchema).required(),
    deletedStepIds: joi.array().items(mongoIdSchema).required(),
    unchangedStepIds: joi.array().items(mongoIdSchema).required(),
});
export const processStatusUpdateMetadataSchema = joi.object({
    processId: mongoIdSchema.required(),
    stepId: mongoIdSchema,
    status: joi
        .string()
        .valid(...Object.values(Status))
        .required(),
});
export const newProcessMetadataSchema = joi.object({
    processId: mongoIdSchema.required(),
});
export const deleteProcessMetadataSchema = joi.object({
    processName: joi.string().required(),
});
export const archiveProcessMetadataSchema = joi.object({
    processId: joi.string().required(),
    isArchived: joi.boolean(),
});
export const dateAboutToExpireMetadataSchema = joi.object({
    entityId: joi.string().required(),
    propertyName: joi.string().required(),
    datePropertyValue: joi.date().required(),
});

export const validateNotificationMetadataSchema = joi.custom((value, helpers) => {
    const parent: Omit<INotification, 'createdAt'> = helpers.state.ancestors[0];
    let schema: joi.ObjectSchema;

    switch (parent.type) {
        case NotificationType.ruleBreachAlert:
            schema = ruleBreachAlertMetadataSchema;
            break;
        case NotificationType.ruleBreachRequest:
            schema = ruleBreachRequestMetadataSchema;
            break;
        case NotificationType.ruleBreachResponse:
            schema = ruleBreachResponseMetadataSchema;
            break;

        case NotificationType.processReviewerUpdate:
            schema = processReviewerUpdateMetadataSchema;
            break;
        case NotificationType.processStatusUpdate:
            schema = processStatusUpdateMetadataSchema;
            break;
        case NotificationType.newProcess:
            schema = newProcessMetadataSchema;
            break;
        case NotificationType.dateAboutToExpire:
            schema = dateAboutToExpireMetadataSchema;
            break;
        case NotificationType.deleteProcess:
            schema = deleteProcessMetadataSchema;
            break;
        case NotificationType.archivedProcess:
            schema = archiveProcessMetadataSchema;
            break;
        default:
            throw new Error('incorrect notification type');
    }

    const { error } = schema.validate(value);

    if (error) throw error;
    return value;
});
