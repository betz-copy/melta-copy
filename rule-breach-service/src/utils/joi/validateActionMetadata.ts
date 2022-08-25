/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';
import { IRuleBreach } from '../interfaces/ruleBreach';
import { ActionTypes } from '../interfaces/actionMetadata';
import { createRelationshipMetadataSchema, deleteRelationshipMetadataSchema, updateEntityMetadataSchema } from './schemas/actionMetadata';

export const validateActionMetadata: joi.CustomValidator = (value, helpers) => {
    const parent: Omit<IRuleBreach, 'createdAt'> = helpers.state.ancestors[0];
    let schema: joi.ObjectSchema;

    switch (parent.actionType) {
        case ActionTypes.CreateRelationship:
            schema = createRelationshipMetadataSchema;
            break;
        case ActionTypes.DeleteRelationship:
            schema = deleteRelationshipMetadataSchema;
            break;
        case ActionTypes.UpdateEntity:
            schema = updateEntityMetadataSchema;
            break;

        default:
            throw new Error('incorrect action type');
    }

    const { error } = schema.validate(value);

    if (error) throw error;
    return value;
};
