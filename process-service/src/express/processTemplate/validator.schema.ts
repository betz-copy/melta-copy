import * as Joi from 'joi';
import { MongoIdSchema, variableNameValidation, innerPropertiesSchema, orderPropertiesSchema } from '../../utils/joi';

// GET /api/templates/process/:templateId
export const getTemplateByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// POST /api/templates/process
export const createTemplateRequestSchema = Joi.object({
    body: {
        name: variableNameValidation.required(),
        displayName: Joi.string().required(),
        steps: Joi.array()
            .items(
                Joi.object({
                    name: variableNameValidation.required(),
                    displayName: Joi.string().required(),
                    properties: innerPropertiesSchema.required(),
                    propertiesOrder: orderPropertiesSchema.required(),
                }),
            )
            .required(),
    },
    query: {},
    params: {},
});

// PUT /api/templates/process/:templateId
export const updateTemplateByIdRequestSchema = Joi.object({
    body: {
        name: variableNameValidation,
        displayName: Joi.string(),
        steps: Joi.array().items(
            Joi.object({
                name: variableNameValidation,
                displayName: Joi.string(),
                properties: innerPropertiesSchema,
                propertiesOrder: orderPropertiesSchema,
            }),
        ),
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// DELETE /api/templates/process/:templateId
export const deleteTemplateByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// POST /api/templates/process/search
export const searchTemplateRequestSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
