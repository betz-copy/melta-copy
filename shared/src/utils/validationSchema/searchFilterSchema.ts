/* eslint-disable import/prefer-default-export */
import Joi from 'joi';

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

export const searchFilterSchema = Joi.object({
    $and: Joi.alternatives().try(
        filterOfTemplateSchema,
        Joi.array()
            .items(Joi.alternatives().try(filterOfTemplateSchema, Joi.link('#searchFilter')))
            .min(1),
    ),
    $or: Joi.array()
        .items(Joi.alternatives().try(filterOfTemplateSchema, Joi.link('#searchFilter')))
        .min(1),
})
    .xor('$and', '$or')
    .id('searchFilter');
