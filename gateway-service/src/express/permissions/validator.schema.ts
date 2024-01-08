import Joi from 'joi';
import { resourceTypeOptions, scopeOptions } from '../../externalServices/permissionsApi';

const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

const ScopeSchema = Joi.string().valid(...scopeOptions);

const isAlternativesErrorReport = (error: Joi.ErrorReport): error is Joi.ErrorReport & { local: { message: string; details: object[] } } => {
    // todo: learn why "alternatives.any" and not "alternatives.one"
    // todo: better return type, instead of details: object[]
    return error.code === 'alternatives.any';
};

const formatAlternativesErrorReport: Joi.ValidationErrorFunction = ([error]) => {
    if (!isAlternativesErrorReport(error)) {
        throw new Error('assuming formatting error is of alternatives.match');
    }
    const { details } = error.local;
    const alternativesErrorMessages = details.map((alternativeError) => (alternativeError as any).message);

    return new Joi.ValidationError(
        `failed to match any of the alternatives: [${alternativesErrorMessages.join(', ')}]`,
        error.local.details,
        error.value,
    );
};

const basePermissionSchema = {
    userId: MongoIdSchema.required(),
    resourceType: Joi.string()
        .valid(...resourceTypeOptions)
        .required(),
    category: Joi.alternatives().match('one').try(MongoIdSchema, Joi.valid('All')).error(formatAlternativesErrorReport),
    scopes: Joi.array().items(ScopeSchema).min(1).required(),
};

// GET /api/permissions
export const getPermissionsOfUsersRequestSchema = Joi.object({
    params: {},
    query: {},
    body: {},
});

// GET /api/permissions/my
export const getMyPermissionsRequestSchema = Joi.object({
    params: {},
    query: {},
    body: {},
});

// POST /api/permissions/
export const createPermissionsBulkRequestSchema = Joi.object({
    body: Joi.array().items(basePermissionSchema).required(),
    query: {},
    params: {},
});

// put /api/permissions/
export const updatePermissionsBulkRequestSchema = Joi.object({
    body: Joi.array()
        .items({
            ...basePermissionSchema,
            _id: MongoIdSchema,
        })
        .required(),
    query: {},
    params: {},
});

// DELETE /api/permissions?ids=...
export const deletePermissionsRequestSchema = Joi.object({
    params: {},
    body: {},
    query: {
        ids: Joi.array().items(MongoIdSchema).required(),
    },
});
