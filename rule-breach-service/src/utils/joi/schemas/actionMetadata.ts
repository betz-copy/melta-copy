import * as joi from 'joi';
import { mongoIdSchema } from '.';

export const createRelationshipMetadataSchema = joi.object({
    relationshipTemplateId: mongoIdSchema.required(),
    sourceEntityId: mongoIdSchema.required(),
    destinationEntityId: mongoIdSchema.required(),
});

export const deleteRelationshipMetadataSchema = joi.object({
    relationshipId: mongoIdSchema.required(),
    relationshipTemplateId: mongoIdSchema.required(),
    sourceEntityId: mongoIdSchema.required(),
    destinationEntityId: mongoIdSchema.required(),
});

export const updateEntityMetadataSchema = joi.object({
    entityId: mongoIdSchema.required(),
    before: joi.object().min(1),
    updatedFields: joi.object().min(1).required(),
});

export const actionMetadataSchema = joi.alternatives(createRelationshipMetadataSchema, deleteRelationshipMetadataSchema, updateEntityMetadataSchema);
