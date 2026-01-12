import { MongoIdSchema } from '@packages/utils';
import Joi from 'joi';

const printingTemplateBodySchema = Joi.object({
    name: Joi.string().required(),
    sections: Joi.array()
        .items(
            Joi.object({
                categoryId: MongoIdSchema.required(),
                entityTemplateId: MongoIdSchema.required(),
                selectedColumns: Joi.array().items(Joi.string()).required(),
            }),
        )
        .required(),
    compactView: Joi.boolean().required(),
    addEntityCheckbox: Joi.boolean().required(),
    appendSignatureField: Joi.boolean().required(),
});

// GET /api/print/templates/:templateId
export const getTemplateByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// POST /api/print/templates
export const createTemplateRequestSchema = Joi.object({
    query: {},
    body: printingTemplateBodySchema,
    params: {},
});

// PUT /api/print/templates/:templateId
export const updateTemplateByIdRequestSchema = Joi.object({
    query: {},
    body: printingTemplateBodySchema,
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// DELETE /api/print/templates/:templateId
export const deleteTemplateByIdRequestSchema = Joi.object({
    query: {},
    body: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// POST /api/print/templates/search
export const searchTemplatesRequestSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        ids: Joi.array().items(MongoIdSchema),
        limit: Joi.number().integer().min(0).default(0),
        skip: Joi.number().integer().min(0).default(0),
    },
    params: {},
});
