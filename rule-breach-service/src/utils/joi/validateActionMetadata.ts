import { ActionTypes, IAction } from '@packages/action';
import * as joi from 'joi';
import {
    createEntityMetadataSchema,
    createRelationshipMetadataSchema,
    cronjobMetadataSchema as cronjobRunMetadataSchema,
    deleteRelationshipMetadataSchema,
    duplicateEntityMetadataSchema,
    updateEntityMetadataSchema,
    updateEntityStatusMetadataSchema,
} from './schemas/actionMetadata';

export const validateActionMetadata: joi.CustomValidator = (value, helpers) => {
    const parent: IAction = helpers.state.ancestors[0];
    let schema: joi.ObjectSchema;

    switch (parent.actionType) {
        case ActionTypes.CreateRelationship:
            schema = createRelationshipMetadataSchema;
            break;
        case ActionTypes.DeleteRelationship:
            schema = deleteRelationshipMetadataSchema;
            break;
        case ActionTypes.CreateEntity:
            schema = createEntityMetadataSchema;
            break;
        case ActionTypes.DuplicateEntity:
            schema = duplicateEntityMetadataSchema;
            break;
        case ActionTypes.UpdateEntity:
            schema = updateEntityMetadataSchema;
            break;
        case ActionTypes.UpdateStatus:
            schema = updateEntityStatusMetadataSchema;
            break;
        case ActionTypes.CronjobRun:
            schema = cronjobRunMetadataSchema;
            break;

        default:
            throw new Error('incorrect action type');
    }

    const { error } = schema.validate(value);

    if (error) throw error;
    return value;
};
