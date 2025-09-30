import * as joi from 'joi';
import { mongoIdSchema } from '.';

export const createRelationshipMetadataSchema = joi.object({
    relationshipTemplateId: mongoIdSchema.required(),
    sourceEntityId: joi.string().required(),
    destinationEntityId: joi.string().required(),
});

export const deleteRelationshipMetadataSchema = joi.object({
    relationshipTemplateId: mongoIdSchema.required(),
    relationshipId: joi.string().required(),
    sourceEntityId: joi.string().required(),
    destinationEntityId: joi.string().required(),
});

export const createEntityMetadataSchema = joi.object({
    templateId: mongoIdSchema.required(),
    properties: joi.object().min(1).required(),
});
export const duplicateEntityMetadataSchema = joi.object({
    templateId: mongoIdSchema.required(),
    properties: joi.object().min(1).required(),
    entityIdToDuplicate: joi.string().required(),
});

export const updateEntityMetadataSchema = joi.object({
    entityId: joi.string().required(),
    before: joi.object().min(1),
    updatedFields: joi.object().min(1).required(),
});

export const updateEntityStatusMetadataSchema = joi.object({
    entityId: joi.string().required(),
    disabled: joi.boolean().required(),
});

export const cronjobMetadataSchema = joi.object({
    entityId: joi.string().required(),
});

export const actionMetadataSchema = joi.alternatives(
    createRelationshipMetadataSchema,
    deleteRelationshipMetadataSchema,
    updateEntityMetadataSchema,
    cronjobMetadataSchema,
);
