import { Request } from 'express';
import * as Joi from 'joi';
import { wrapValidator } from '../express';

export const defaultValidationOptions: Joi.ValidationOptions = {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
};

// biome-ignore lint/suspicious/noExplicitAny: lol
export const normalizeRequest = (req: any, value: any) => {
    req.originalBody = req.body;
    req.body = value.body;

    req.originalQuery = req.query;
    req.query = value.query;

    req.originalParams = req.params;
    req.params = value.params;
};

export const ValidateRequest = (schema: Joi.ObjectSchema<any>, options: Joi.ValidationOptions = defaultValidationOptions) => {
    const validator = async (req: Request) => {
        const { error, value } = schema.unknown().validate(req, options);
        if (error) throw error;
        if (options.convert) normalizeRequest(req, value);
    };

    return wrapValidator(validator);
};

export const basicValidateRequest = <T extends object>(
    schema: Joi.ObjectSchema<T>,
    value: unknown,
    options: Joi.ValidationOptions = defaultValidationOptions,
): T => {
    const { error, value: newValue } = schema.unknown().validate(value, options);

    if (error) throw error;

    return newValue;
};

export const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

export const fileSchema = Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().min(1).required(),
}).unknown(true);

export const iconFileSchema = fileSchema.keys({
    originalname: Joi.string()
        .regex(/\.(svg|png|jpeg|jpg)$/i)
        .required(),
});

export const ColorSchema = Joi.string().regex(/^#[A-Fa-f0-9]{6}$/);

export const FilePathSchema = Joi.string()
    .regex(/^\/.*[^/]$/, 'valid file path')
    .allow('/');

export const HexColorSchema = Joi.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'valid hex color');

export const WorkspaceNameSchema = Joi.string().regex(/^[a-zA-Z0-9_-]+$/, 'valid workspace name');

export const variableNameValidation = Joi.string().regex(/^[a-zA-Z][a-zA-Z_$0-9]*$/);

export const nativeDataTypeSchema = Joi.alternatives(Joi.boolean(), Joi.string(), Joi.number());

export const filterOfFieldSchema = Joi.object({
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
}).id('filterOfField');

export const filterOfTemplateSchema = Joi.object().pattern(Joi.string(), filterOfFieldSchema);
export const searchFilterSchema = Joi.object({
    $and: Joi.alternatives(filterOfTemplateSchema, Joi.array().items(filterOfTemplateSchema)),
    $or: Joi.array().items(filterOfTemplateSchema),
});
