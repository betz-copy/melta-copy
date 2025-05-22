import Joi from 'joi';
import { MongoIdSchema } from '../../utils/joi';
import { IAggregationType, IChartType, IPermission } from '../../externalServices/dashboardService/chartService';

// format of properties keys in entity template
export const variableNameValidation = Joi.string().regex(/^[a-zA-Z][a-zA-Z_$0-9]*$/);

const nativeDataTypeSchema = Joi.alternatives(Joi.boolean(), Joi.string(), Joi.number());

const filterOfFieldSchema = Joi.object({
    $eq: nativeDataTypeSchema.allow(null),
    $ne: nativeDataTypeSchema.allow(null),
    $eqi: Joi.string(),
    $rgx: Joi.string(), // regex syntax of Neo4j (Java Regular Expression). validated by neo itself
    $gt: nativeDataTypeSchema,
    $gte: nativeDataTypeSchema,
    $lt: nativeDataTypeSchema,
    $lte: nativeDataTypeSchema,
    $in: Joi.alternatives(
        Joi.array().items(Joi.boolean().allow(null)),
        Joi.array().items(Joi.string().allow(null)),
        Joi.array().items(Joi.number().allow(null)),
    ),
    $not: Joi.link('#filterOfField'),
})
    .min(1)
    .id('filterOfField');

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
        .valid(...Object.values(IPermission))
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
    },
    query: {},
    params: {
        templateId: MongoIdSchema.required(),
    },
});

// POST /api/charts
export const createChartRequestSchema = Joi.object({
    body: { chart: chartSchema.required(), toDashboard: Joi.bool() },
    query: {},
    params: {},
});

// PUT /api/charts/:chartId
export const updateChartRequestSchema = Joi.object({
    body: chartSchema.required(),
    query: {},
    params: {
        chartId: MongoIdSchema.required(),
    },
});

// DELETE /api/charts/:chartId
export const deleteChartRequestSchema = Joi.object({
    body: {},
    query: {},
    params: {
        chartId: MongoIdSchema.required(),
    },
});
