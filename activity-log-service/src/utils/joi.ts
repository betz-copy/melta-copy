import { Request } from 'express';
import * as Joi from 'joi';
import { wrapValidator } from './express';

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

export const basicValidateRequest = (schema: Joi.ObjectSchema<any>, value: any, options: Joi.ValidationOptions = defaultValidationOptions) => {
    const { error, value: newValue } = schema.unknown().validate(value, options);

    if (error) {
        throw error;
    }

    return newValue;
};

export const mongoIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');

export default ValidateRequest;
