import Joi from 'joi';
import { brokenRuleSchema } from '../rules/ignoredRuleSchema';

export const IActionSchema = Joi.object({
    actionType: Joi.string()
        .valid('create-relationship', 'delete-relationship', 'create-entity', 'duplicate-entity', 'update-entity', 'update-status')
        .required(),
    actionMetadata: Joi.object()
        .when('actionType', {
            is: 'create-relationship',
            then: Joi.object({
                relationshipTemplateId: Joi.string().required(),
                sourceEntityId: Joi.string().required(),
                destinationEntityId: Joi.string().required(),
            }).required(),
        })
        .when('actionType', {
            is: 'delete-relationship',
            then: Joi.object({
                relationshipId: Joi.string().required(),
                relationshipTemplateId: Joi.string().required(),
                sourceEntityId: Joi.string().required(),
                destinationEntityId: Joi.string().required(),
            }).required(),
        })
        .when('actionType', {
            is: 'create-entity',
            then: Joi.object({
                templateId: Joi.string().required(),
                properties: Joi.object().required(),
            }).required(),
        })
        .when('actionType', {
            is: 'duplicate-entity',
            then: Joi.object({
                templateId: Joi.string().required(),
                properties: Joi.object().required(),
                entityIdToDuplicate: Joi.string().required(),
            }).required(),
        })
        .when('actionType', {
            is: 'update-entity',
            then: Joi.object({
                entityId: Joi.string().required(),
                before: Joi.object().required(),
                updatedFields: Joi.object().required(),
            }).required(),
        })
        .when('actionType', {
            is: 'update-status',
            then: Joi.object({
                entityId: Joi.string().required(),
                disabled: Joi.boolean().required(),
            }).required(),
        }),
});

/**
 * GET /api/bulkActions/bulk
 */
export const runBulkOfActionsInMultipleTransactionsSchema = Joi.object({
    query: {
        dryRun: Joi.boolean().required(),
    },
    body: {
        actionsGroups: Joi.array().items(Joi.array().items(IActionSchema)),
        ignoredRules: Joi.array().items(brokenRuleSchema).default([]),
        userId: Joi.string().required(),
    },
    params: {},
});
