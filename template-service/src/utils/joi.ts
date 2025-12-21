/* eslint-disable import/prefer-default-export */
import Joi from 'joi';

export const joiValidate = <T>(schema: Joi.AnySchema<any>, data: T, options: Joi.ValidationOptions = defaultValidationOptions): T => {
    const { error, value } = schema.validate(data, options);
    if (error) {
        throw error;
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
