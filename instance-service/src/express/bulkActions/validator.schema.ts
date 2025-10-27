import { ActionTypes } from '@microservices/shared';
import Joi from 'joi';
import { brokenRuleSchema } from '../rules/ignoredRuleSchema';

const createRelationshipSchema = Joi.object({
    relationshipTemplateId: Joi.string().required(),
    sourceEntityId: Joi.string().required(),
    destinationEntityId: Joi.string().required(),
});
const deleteRelationshipSchema = Joi.object({
    relationshipId: Joi.string().required(),
    relationshipTemplateId: Joi.string().required(),
    sourceEntityId: Joi.string().required(),
    destinationEntityId: Joi.string().required(),
});
const createEntitySchema = Joi.object({
    templateId: Joi.string().required(),
    properties: Joi.object().required(),
});
const duplicateEntitySchema = Joi.object({
    templateId: Joi.string().required(),
    properties: Joi.object().required(),
    entityIdToDuplicate: Joi.string().required(),
});
const updateEntitySchema = Joi.object({
    entityId: Joi.string().required(),
    before: Joi.object().required(),
    updatedFields: Joi.object().required(),
});
const updateStatusSchema = Joi.object({
    entityId: Joi.string().required(),
    disabled: Joi.boolean().required(),
});
const actionMetadataSchema = Joi.alternatives()
    .conditional('actionType', {
        switch: [
            { is: ActionTypes.CreateRelationship, then: createRelationshipSchema },
            { is: ActionTypes.DeleteRelationship, then: deleteRelationshipSchema },
            { is: ActionTypes.CreateEntity, then: createEntitySchema },
            { is: ActionTypes.DuplicateEntity, then: duplicateEntitySchema },
            { is: ActionTypes.UpdateEntity, then: updateEntitySchema },
            { is: ActionTypes.UpdateStatus, then: updateStatusSchema },
        ],
    })
    .required();
export const IActionSchema = Joi.object({
    actionType: Joi.string()
        .valid(
            ActionTypes.CreateRelationship,
            ActionTypes.DeleteRelationship,
            ActionTypes.CreateEntity,
            ActionTypes.DuplicateEntity,
            ActionTypes.UpdateEntity,
            ActionTypes.UpdateStatus,
        )
        .required(),
    actionMetadata: actionMetadataSchema,
});

/**
 * GET /api/bulk-actions/bulk
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
