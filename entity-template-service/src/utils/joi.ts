import { Request } from 'express';
import * as Joi from 'joi';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { wrapValidator } from './express';
import { IProperties } from '../express/entityTemplate/interface';

const ajv = new Ajv();
ajv.addFormat('fileId', /.*/);
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);

const stringFormats = ['date', 'date-time', 'email', 'fileId'];
const allowedJSONSchemaTypes = ['string', 'number', 'boolean'];

const propertiesArraySchema = Joi.array()
    .items(
        Joi.object({
            title: Joi.string().invalid('תאריך יצירה', 'תאריך עדכון', 'מושבת').required(),
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

export const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

export const ColorSchema = Joi.string().regex(/^#[A-Fa-f0-9]{6}$/);

export const variableNameValidation = Joi.string().regex(/^[a-zA-Z][a-zA-Z_$0-9]*$/);

const propertiesKeysArraySchema = Joi.array().items(variableNameValidation.invalid('createdAt', 'updatedAt', 'disable'));

const validatePropertiesArrayInProperties = (propertiesArray: string[], properties: IProperties['properties']) => {
    const propertiesKeys = Object.keys(properties);
    const doesEveryPropertyInPropertiesKeys = propertiesArray.every((item) => propertiesKeys.includes(item));

    if (!doesEveryPropertyInPropertiesKeys) {
        throw new Error('not all items are properties');
    }

    return propertiesArray;
};

const validateHideArrayNotInPropertiesPreview = (hide: string[], propertiesPreview: string[]) => {
    const isHideArrayNotInPreview = hide.every((item) => !propertiesPreview.includes(item));

    if (!isHideArrayNotInPreview) {
        throw new Error('item in hide array cannot be in preview array');
    }

    return hide;
};

const customHideValidation: Joi.CustomValidator = (hide: string[], helpers) => {
    validatePropertiesArrayInProperties(hide, helpers.state.ancestors[0].properties);

    return validateHideArrayNotInPropertiesPreview(hide, helpers.state.ancestors[1].propertiesPreview);
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
        hide: Joi.array().unique().items(Joi.string()).custom(customHideValidation),
    })
    .custom((value) => {
        ajv.compile(value); // throws an error if JSONSchema is invalid

        return value;
    });

const customOrderPropertiesValidation: Joi.CustomValidator = (propertiesOrder: string[], helpers) => {
    const { properties } = helpers.state.ancestors[0].properties;
    const propertiesKeys = Object.keys(properties);

    if (propertiesKeys.length !== propertiesOrder.length) {
        throw new Error('not all fields are ordered');
    }

    return validatePropertiesArrayInProperties(propertiesOrder, properties);
};
export const orderPropertiesSchema = Joi.array().unique().items(Joi.string()).custom(customOrderPropertiesValidation);

const customPreviewPropertiesValidation: Joi.CustomValidator = (propertiesPreview: string[], helpers) => {
    return validatePropertiesArrayInProperties(propertiesPreview, helpers.state.ancestors[0].properties.properties);
};
export const previewPropertiesSchema = Joi.array().unique().items(Joi.string()).custom(customPreviewPropertiesValidation);

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

export default ValidateRequest;
