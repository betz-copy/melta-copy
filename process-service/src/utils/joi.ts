import { Request } from 'express';
import * as Joi from 'joi';
import { wrapValidator } from './express';
import config from '../config';
import { ProcessPropertyFormats } from '../express/templates/processes/interface';
import ajv from './ajv';

const stringFormats = Object.values(ProcessPropertyFormats);
const allowedJSONSchemaTypes = ['string', 'number', 'boolean'];

const defaultValidationOptions: Joi.ValidationOptions = {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
};

const normalizeRequest = (req: any, value: any) => {
    req.originalBody = req.body;
    req.body = value.body;

    req.originalQuery = req.query;
    req.query = value.query;

    req.originalParams = req.params;
    req.params = value.params;
};

const ValidateRequest = (schema: Joi.ObjectSchema<any>, options: Joi.ValidationOptions = defaultValidationOptions) => {
    const validator = async (req: Request) => {
        const { error, value } = schema.unknown().validate(req, options);
        if (error) {
            throw error;
        }

        if (options.convert) {
            normalizeRequest(req, value);
        }
    };

    return wrapValidator(validator);
};

export const variableNameValidation = Joi.string().regex(/^[a-zA-Z][a-zA-Z_$0-9]*$/);

export const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

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

export default ValidateRequest;
