import Joi from 'joi';
import { searchFilterSchema, DashboardItemType } from '@microservices/shared';

const TableMetaDataSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    templateId: Joi.string().required(),
    columns: Joi.array().items(Joi.string().required()).min(1).required(),
    filter: searchFilterSchema.custom((value) => {
        // todo: upgrade mongo version up to 5 and then delete that convert
        if (value) return JSON.stringify(value);
        return value;
    }),
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

// POST /api/dashboard/relatedItems
export const getRelatedDashboardItemsRequestSchema = Joi.object({
    body: {
        relatedIds: Joi.array().items(Joi.string().required()).min(1).required(),
    },
    query: {},
    params: {},
});

// DELETE /api/dashboard/relatedItem/:relatedId
export const deleteDashboardItemByRelatedItemRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        relatedId: Joi.string().required(),
    },
});
