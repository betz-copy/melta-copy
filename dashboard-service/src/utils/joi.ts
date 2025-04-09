import { Request } from 'express';
import Joi from 'joi';
import { wrapValidator } from './express';

export const defaultValidationOptions: Joi.ValidationOptions = {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
};

export const joiValidate = <T extends any>(schema: Joi.AnySchema<any>, data: T, options: Joi.ValidationOptions = defaultValidationOptions): T => {
    const { error, value } = schema.validate(data, options);
    if (error) {
        throw error;
    }

    return value;
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

export const ColorSchema = Joi.string().regex(/^#[A-Fa-f0-9]{6}$/);

export const MongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

export const ExtendedJoi = Joi.extend(
    {
        base: Joi.object(),
        type: 'stringToObject',
        messages: {
            'string.object': '{{#label}} is not a string of json object',
        },
        coerce: (value: string, helpers) => {
            try {
                return { value: JSON.parse(value) };
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

export default ValidateRequest;
