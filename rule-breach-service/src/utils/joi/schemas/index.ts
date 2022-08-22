import * as joi from 'joi';
import { ActionTypes } from '../../interfaces';
import { validateActionMetadata } from '../customValidation';

export const mongoIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

export const createRelationshipMetadataSchema = joi.object({
    relationshipId: mongoIdSchema.required(),
});

export const deleteRelationshipMetadataSchema = joi.object({
    relationshipId: mongoIdSchema.required(),
});

export const updateEntityMetadataSchema = joi.object({
    entityId: mongoIdSchema.required(),
    before: joi.object().min(1),
    updatedFields: joi.object().min(1).required(),
});

export const ruleBreachSchema = joi.object({
    originUserId: mongoIdSchema.required(),
    brokenRules: joi
        .array()
        .items(
            joi.object({
                ruleId: mongoIdSchema.required(),
                relationshipsIds: joi.array().items(mongoIdSchema).required(),
            }),
        )
        .min(1)
        .required(),
    actionType: joi
        .string()
        .valid(...Object.values(ActionTypes))
        .required(),
    actionMetadata: joi.custom(validateActionMetadata).required(),
});
