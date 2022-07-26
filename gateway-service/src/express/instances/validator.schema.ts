import * as Joi from 'joi';
import { ExtendedJoi, fileSchema } from '../../utils/joi';

// POST /api/instances/entities
export const createEntityInstanceSchema = Joi.object({
    body: Joi.object({
        templateId: Joi.string().required(),
        properties: ExtendedJoi.stringToObject(), // properties is json string (because of form data)
    }).unknown(true),
    query: {},
    params: {},
    files: Joi.array().items(fileSchema),
});

// PUT /api/instances/entities/:id
export const updateEntityInstanceSchema = Joi.object({
    body: Joi.object({
        templateId: Joi.string().required(),
        properties: ExtendedJoi.stringToObject(), // properties is json string (because of form data)
    }).unknown(true),
    query: {},
    params: { id: Joi.string().required() },
    files: Joi.array().items(fileSchema),
});

// PATCH /api/instances/entities/:id
export const updateEntityStatusSchema = Joi.object({
    body: Joi.object({
        disabled: Joi.boolean().required(),
    }).unknown(true),
    query: {},
    params: { id: Joi.string().required() },
});

// DELETE /api/instances/entities/:id
export const deleteEntityInstanceSchema = Joi.object({
    body: {},
    query: {},
    params: { id: Joi.string().required() },
});
