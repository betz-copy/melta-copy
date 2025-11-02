import { MongoIdSchema, ProcessPropertyFormats, variableNameValidation } from '@microservices/shared';
import * as Joi from 'joi';
import config from '../config';
import ajv from './ajv';

const stringFormats = Object.values(ProcessPropertyFormats);
const allowedJSONSchemaTypes = ['string', 'number', 'boolean', 'array', 'signature'];

export const updateAndCreateStepsSchema = Joi.object().pattern(MongoIdSchema, Joi.array().items(Joi.string()));

export const updateStatusPropertiesSchema = Joi.string().when('status', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
});

const propertiesArraySchema = Joi.array()
    .items(
        Joi.object({
            title: Joi.string().required(),
            type: Joi.string()
                .valid(...allowedJSONSchemaTypes)
                .required(),
            format: Joi.string()
                .valid(...stringFormats)
                .when('type', { not: 'string', then: Joi.forbidden() })
                .when('pattern', { is: Joi.exist(), then: Joi.forbidden() })
                .when('enum', { is: Joi.exist(), then: Joi.forbidden() }),
            enum: Joi.array().items(Joi.string()).when('type', { not: 'string', then: Joi.forbidden() }),
            pattern: Joi.string().when('type', { not: 'string', then: Joi.forbidden() }),
            patternCustomErrorMessage: Joi.string().when('pattern', { is: Joi.exist(), then: Joi.required(), otherwise: Joi.forbidden() }),
            items: Joi.object({
                type: Joi.string().valid('string').required(),
                format: Joi.string().valid('fileId'),
                enum: Joi.when('format', {
                    is: 'fileId',
                    then: Joi.array().items(Joi.string()).max(0), // If format is fileId, enum can be empty
                    otherwise: Joi.array().items(Joi.string()).min(1), // If format is not fileId, enum must have minimum length of 1
                }).when('type', {
                    is: 'array',
                    then: Joi.required(), // If type is array, enum must be included
                    otherwise: Joi.forbidden(), // If type is not array, enum is forbidden
                }),
            }).xor('format', 'enum'),
        }).nand('pattern', 'enum'),
    )
    .unique((a, b) => a.title === b.title);

const propertiesKeysArraySchema = Joi.array().items(variableNameValidation);

const validatePropertiesArray = (value, propertiesKeys) => {
    const isRequiredValid = value.every((item) => propertiesKeys.includes(item));

    if (!isRequiredValid) {
        throw new Error('not all items are properties');
    }

    return value;
};

const customRequiredValidation = (value, helpers) => {
    return validatePropertiesArray(value, Object.keys(helpers.state.ancestors[0].properties));
};

export const innerPropertiesSchema = Joi.object()
    .keys({
        type: Joi.string().valid('object').required(),
        properties: Joi.object()
            .custom((value) => {
                const { error: propertiesError } = propertiesArraySchema.validate(Object.values(value)); // titles are unique
                const { error: keyError } = propertiesKeysArraySchema.validate(Object.keys(value));
                if (propertiesError) {
                    throw propertiesError;
                }

                if (keyError) {
                    throw keyError;
                }

                return value;
            })
            .unknown(true)
            .required(),
        required: Joi.array().unique().items(Joi.string()).custom(customRequiredValidation).required(),
    })
    .custom((value) => {
        ajv.compile(value); // throws an error if JSONSchema is invalid
        return value;
    });

const customOrderPropertiesValidation = (value, helpers) => {
    const propertiesKeys = Object.keys(helpers.state.ancestors[0].properties.properties);

    if (propertiesKeys.length !== value.length) {
        throw new Error('not all fields are ordered');
    }
    return validatePropertiesArray(value, propertiesKeys);
};

const orderPropertiesSchema = Joi.array().unique().items(Joi.string()).custom(customOrderPropertiesValidation).required();

const baseStepSchema = Joi.object({
    name: variableNameValidation.required(),
    displayName: Joi.string().required(),
    properties: innerPropertiesSchema.required(),
    propertiesOrder: orderPropertiesSchema.required(),
    reviewers: Joi.array().items(Joi.string()).required(),
    disableAddingReviewers: Joi.boolean(),
    iconFileId: Joi.string().allow(null),
});

const processTemplateBaseSchema = {
    name: variableNameValidation,
    displayName: Joi.string(),
    details: Joi.object({
        properties: innerPropertiesSchema,
        propertiesOrder: orderPropertiesSchema,
    }),
    steps: Joi.array().items(baseStepSchema).min(1),
};

const topLevelRequiredFields = Object.values(config.processFields);

export const createProcessTemplateBody = Joi.object({
    ...processTemplateBaseSchema,
})
    .options({ abortEarly: false })
    .with(topLevelRequiredFields[0], topLevelRequiredFields.slice(1));

export const updateProcessTemplateBody = Joi.object({
    ...processTemplateBaseSchema,
    steps: Joi.array()
        .items(baseStepSchema.keys({ _id: Joi.string() }))
        .min(1),
}).options({ abortEarly: false });
