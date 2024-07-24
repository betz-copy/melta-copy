import { Request } from 'express';
import Joi from 'joi';
import { wrapValidator } from './express';

const validateProperties = (value, helpers) => {
    const properties = value;
    const requiredFields = Object.keys(properties).filter((key) => properties[key].readOnly !== true);
    console.log({ value, helpers, properties, requiredFields });

    for (const key of requiredFields) {
        if (properties[key].required && properties[key].readOnly) {
            return helpers.message(`Property ${key} is readOnly and cannot be required`);
        }
    }

    return value;
};

export const ExtendedJoi = Joi.extend(
    {
        base: Joi.object(),
        type: 'stringToObject',
        messages: {
            'string.object': '{{#label}} is not a string of json object',
        },
        coerce: (value: string, helpers) => {
            try {
                let parsedValue = JSON.parse(value);
                if ('required' in parsedValue && 'type' in parsedValue && 'hide' in parsedValue)
                    parsedValue = validateProperties(parsedValue, helpers);
                return { value: parsedValue };
            } catch {
                return { errors: [helpers.error('string.object')] };
            }
        },
    },
    {
        base: Joi.array(),
        type: 'stringToArray',
        messages: {
            'string.array': '{{#label}} is not a string of array',
        },
        coerce: (value: string, helpers) => {
            try {
                return { value: JSON.parse(value) };
            } catch {
                return { errors: [helpers.error('string.array')] };
            }
        },
    },
);

export const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

export const ColorSchema = Joi.string().regex(/^#[A-Fa-f0-9]{6}$/);

export const fileSchema = Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    size: Joi.number().min(1).required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    path: Joi.string().required(),
}).unknown(true);

export const iconFileSchema = fileSchema.keys({
    originalname: Joi.string()
        .regex(/\.(svg|png)$/)
        .required(),
});

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
