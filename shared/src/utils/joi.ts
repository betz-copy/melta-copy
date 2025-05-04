import { Request } from 'express';
import * as Joi from 'joi';
import { wrapValidator } from './express';

export const defaultValidationOptions: Joi.ValidationOptions = {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
};

export const normalizeRequest = (req: any, value: any) => {
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

export default ValidateRequest;
