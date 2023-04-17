import * as joi from 'joi';
import { mongoIdSchema } from '.';
import { INotification, NotificationType } from '../../../express/notifications/interface';
import { ProcessStatus } from '../../interfaces/processes';

export const ruleBreachAlertMetadataSchema = joi.object({
    alertId: mongoIdSchema.required(),
});
export const ruleBreachRequestMetadataSchema = joi.object({
    requestId: mongoIdSchema.required(),
});
export const ruleBreachResponseMetadataSchema = joi.object({
    requestId: mongoIdSchema.required(),
});

export const processApproverUpdateMetadataSchema = joi.object({
    processId: mongoIdSchema.required(),
    approverStepIds: joi.array().items(mongoIdSchema).required(),
});
export const processStatusUpdateMetadataSchema = joi.object({
    processId: mongoIdSchema.required(),
    stepId: mongoIdSchema,
    status: joi
        .string()
        .valid(...Object.values(ProcessStatus))
        .required(),
});
export const newProcessMetadataSchema = joi.object({
    processId: mongoIdSchema.required(),
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

        case NotificationType.processApproverUpdate:
            schema = processApproverUpdateMetadataSchema;
            break;
        case NotificationType.processStatusUpdate:
            schema = processStatusUpdateMetadataSchema;
            break;
        case NotificationType.newProcess:
            schema = newProcessMetadataSchema;
            break;

        default:
            throw new Error('incorrect notification type');
    }

    const { error } = schema.validate(value);

    if (error) throw error;
    return value;
});
