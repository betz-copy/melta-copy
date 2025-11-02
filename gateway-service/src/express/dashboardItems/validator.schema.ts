import { DashboardItemType, searchFilterSchema } from '@microservices/shared';
import Joi from 'joi';

const TableMetaDataSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    templateId: Joi.string().required(),
    childTemplateId: Joi.string(),
    columns: Joi.array().items(Joi.string().required()).min(1).required(),
    filter: searchFilterSchema,
});

const dashboardSchema = Joi.object({
    type: Joi.string()
        .valid(...Object.values(DashboardItemType))
        .required(),
    metaData: Joi.alternatives()
        .conditional('type', {
            switch: [
                { is: DashboardItemType.Iframe, then: Joi.string().required() },
                { is: DashboardItemType.Chart, then: Joi.string().required() },
                { is: DashboardItemType.Table, then: TableMetaDataSchema.required() },
            ],
        })
        .required(),
});

// POST /api/dashboard
export const createDashboardRequestSchema = Joi.object({
    body: dashboardSchema.required(),
    query: {},
    params: {},
});

// PUT /api/dashboard/:dashboardItemId
export const editDashboardItemRequestSchema = Joi.object({
    body: dashboardSchema.required(),
    query: {},
    params: {
        dashboardItemId: Joi.string().required(),
    },
});

// GET /api/dashboard/:dashboardItemId
export const getDashboardItemByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        dashboardItemId: Joi.string().required(),
    },
});

// DELETE /api/dashboard/:dashboardItemId
export const deleteDashboardItemRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        dashboardItemId: Joi.string().required(),
    },
});

// POST /api/dashboard/search
export const searchDashboardItemsRequestSchema = Joi.object({
    body: {
        textSearch: Joi.string().optional().allow(''),
    },
    query: {},
    params: {},
});
