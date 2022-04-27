import { Request } from 'express';
import * as Joi from 'joi';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as path from 'path';
import { wrapValidator } from './express';
import config from '../config';

const { supportedFilesTypes } = config.service;
const ajv = new Ajv();
ajv.addFormat('fileId', /.*/);
addFormats(ajv);

const stringFormats = ['date', 'time', 'date-time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri'];
const allowedJSONSchemaTypes = ['string', 'number', 'boolean'];
const ExtendedJoi = Joi.extend(
    {
        base: Joi.object(),
        type: 'stringToObject',
        coerce: (value: string, _helpers) => {
            try {
                return { value: JSON.parse(value) };
            } catch {
                return { value };
            }
        },
    },
    {
        base: Joi.string(),
        type: 'fileName',
        validate(value, _helpers) {
            const fileExtension = path.extname(value).slice(1).toLowerCase();
            if (!supportedFilesTypes.includes(fileExtension)) {
                throw new Joi.ValidationError('File type not supported', 'File type not supported', '');
            }

            return value;
        },
    },
);

const propertiesArraySchema = Joi.array()
    .items(
        Joi.object({
            title: Joi.string().required(),
            type: Joi.string()
                .valid(...allowedJSONSchemaTypes)
                .required(),
            format: Joi.string().valid(...stringFormats),
        }),
    )
    .unique((a, b) => a.title === b.title);

export const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

export const ColorSchema = Joi.string().regex(/^#[A-Fa-f0-9]{6}$/);

export const innerPropertiesSchema = ExtendedJoi.stringToObject()
    .keys({
        type: Joi.string().valid('object').required(),
        properties: Joi.object()
            .custom((value) => {
                const { error } = propertiesArraySchema.validate(Object.values(value)); // titles are unique

                if (error) {
                    throw error;
                }

                return value;
            })
            .required(),
        required: Joi.array()
            .items(Joi.string())
            .custom((value, helpers) => {
                const propertiesKeys = Object.keys(helpers.state.ancestors[0].properties);
                const isRequiredValid = value.every((item) => propertiesKeys.includes(item));

                if (!isRequiredValid) {
                    throw new Error('Unknown required property');
                }

                return value;
            }),
    })
    .custom((value) => {
        ajv.compile(value); // throws an error if JSONSchema is invalid

        return value;
    });

export const fileSchema = Joi.object({
    filename: Joi.string().required(),
    originalname: ExtendedJoi.fileName().required(),
    size: Joi.number().min(1).required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    path: Joi.string().required(),
}).unknown(true);

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
