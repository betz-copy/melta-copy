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
        details: Joi.object({
            name: variableNameValidation.required(),
            displayName: Joi.string().required(),
            properties: innerPropertiesSchema.required(),
            propertiesOrder: orderPropertiesSchema.required(),
        }).required(),
        steps: Joi.array()
            .items(
                Joi.object({
                    name: variableNameValidation.required(),
                    displayName: Joi.string().required(),
                    properties: innerPropertiesSchema.required(),
                    propertiesOrder: orderPropertiesSchema.required(),
                    approvers: Joi.array().items(Joi.string()).required(),
                    iconFileId: Joi.string().allow(null),
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
        details: Joi.object({
            name: variableNameValidation,
            displayName: Joi.string(),
            properties: innerPropertiesSchema,
            propertiesOrder: orderPropertiesSchema,
        }),
        steps: Joi.array().items(
            Joi.object({
                name: variableNameValidation,
                displayName: Joi.string(),
                properties: innerPropertiesSchema,
                propertiesOrder: orderPropertiesSchema,
                approvers: Joi.array().items(Joi.string()),
                iconFileId: Joi.string().allow(null),
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
        limit: Joi.number().integer().min(0).default(10),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
