import { MongoIdSchema } from '@packages/utils';
import * as Joi from 'joi';

const ganttItemSchema = Joi.object({
    entityTemplate: Joi.object({
        id: Joi.string().required(),
        startDateField: Joi.string().required(),
        endDateField: Joi.string().required(),
        fieldsToShow: Joi.array().items(Joi.string()).required(),
    }).required(),
    connectedEntityTemplates: Joi.array()
        .items(
            Joi.object({
                relationshipTemplateId: Joi.string().required(),
                fieldsToShow: Joi.array().items(Joi.string()).required(),
            }),
        )
        .required(),
    groupByRelationshipId: Joi.string(),
});

const ganttSchema = Joi.object({
    name: Joi.string().required(),
    items: Joi.array().items(ganttItemSchema).required(),
    groupBy: Joi.object({
        entityTemplateId: Joi.string().required(),
        groupNameField: Joi.string().required(),
    }),
});

// GET /api/gantts/:ganttId
export const getGanttByIdSchema = Joi.object({
    query: {},
    body: {},
    params: {
        ganttId: MongoIdSchema.required(),
    },
});

// POST /api/gantts
export const createGanttSchema = Joi.object({
    query: {},
    body: ganttSchema,
    params: {},
});

// DELETE /api/gantts/:ganttId
export const deleteGanttSchema = Joi.object({
    query: {},
    body: {},
    params: {
        ganttId: MongoIdSchema.required(),
    },
});

// PUT /api/categories
export const updateGanttSchema = Joi.object({
    query: {},
    body: ganttSchema,
    params: {
        ganttId: MongoIdSchema.required(),
    },
});

// POST /api/gantts/search
export const searchGanttsSchema = Joi.object({
    query: {},
    body: {
        search: Joi.string(),
        limit: Joi.number().integer().min(0).default(0),
        step: Joi.number().integer().min(0).default(0),
        entityTemplateId: MongoIdSchema,
        relationshipTemplateIds: Joi.array().items(MongoIdSchema),
    },
    params: {},
});
