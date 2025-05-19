import { fileSchema } from '@microservices/shared';
import Joi from 'joi';

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

export const documentTemplateSchema = fileSchema.keys({
    originalname: Joi.string()
        .regex(/\.(docx)$/)
        .required(),
});

export const excelTemplateSchema = fileSchema.keys({
    originalname: Joi.string()
        .regex(/\.(xlsx|xls)$/)
        .required(),
});
