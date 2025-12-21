
import { IAggregationType, IChartPermission, IChartType } from '@packages/chart';
import Joi from 'joi';

const filterOfFieldSchema = filterOfFieldSchemaShared.min(1).id('filterOfField');
const filterOfTemplateSchema = Joi.object().pattern(Joi.string(), filterOfFieldSchema).min(1);
const searchFilterSchema = Joi.object({
    $and: Joi.alternatives(filterOfTemplateSchema, Joi.array().items(filterOfTemplateSchema).min(1)),
    $or: Joi.array().items(filterOfTemplateSchema).min(1),
}).min(1);

const aggregationSchema = Joi.object({
    type: Joi.string()
        .valid(...Object.values(IAggregationType))
        .required(),
    byField: Joi.string().optional().allow(''),
});

const axisSchema = Joi.object({
    title: Joi.string().allow(''),
    field: Joi.alternatives().try(Joi.string(), aggregationSchema).required(),
});

const IColumnOrLineMetaDataSchema = Joi.object({
    xAxis: axisSchema.required(),
    yAxis: axisSchema.required(),
});

const IPieMetaDataSchema = Joi.object({
    dividedByField: Joi.string().required(),
    aggregationType: aggregationSchema.required(),
});

const INUmberMetaDataSchema = Joi.object({
    accumulator: Joi.alternatives().try(Joi.string(), aggregationSchema).required(),
});

const chartSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    templateId: Joi.string().required(),
    childTemplateId: Joi.string(),
    type: Joi.string()
        .valid(...Object.values(IChartType))
        .required(),
    metaData: Joi.alternatives()
        .conditional('type', {
            switch: [
                { is: IChartType.Column, then: IColumnOrLineMetaDataSchema },
                { is: IChartType.Line, then: IColumnOrLineMetaDataSchema },
                { is: IChartType.Pie, then: IPieMetaDataSchema },
                { is: IChartType.Number, then: INUmberMetaDataSchema },
            ],
        })
        .required(),
    filter: searchFilterSchema,
    permission: Joi.string()
        .valid(...Object.values(IChartPermission))
        .required(),
    createdBy: Joi.string().required(),
});

// GET /api/charts/:chartId
export const getChartByIdRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        chartId: MongoIdSchema.required(),
    },
});

// GET /api/charts/by-template/:templateId
export const getChartByTemplateIdRequestSchema = Joi.object({
    body: {
        textSearch: Joi.string().allow(''),
        childTemplateId: Joi.string(),
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// POST /api/charts
export const createChartRequestSchema = Joi.object({
    body: chartSchema.required(),
    query: { toDashboard: Joi.bool() },
    params: {},
});

// PUT /api/charts/:chartId
export const updateChartRequestSchema = Joi.object({
    body: chartSchema.required(),
    query: {
        deleteReferenceDashboardItems: Joi.bool().optional().default(false),
    },
    params: {
        chartId: MongoIdSchema.required(),
    },
});

// DELETE /api/charts/:chartId
export const deleteChartRequestSchema = Joi.object({
    body: {},
    query: {
        deleteReferenceDashboardItems: Joi.bool().optional().default(false),
    },
    params: {
        chartId: MongoIdSchema.required(),
    },
});
