import Joi from 'joi';

const defaultValidationOptions: Joi.ValidationOptions = {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
};

export const basicValidateRequest = (schema: Joi.ObjectSchema<any>, value: any, options: Joi.ValidationOptions = defaultValidationOptions) => {
    const { error, value: newValue } = schema.unknown().validate(value, options);

    if (error) {
        throw error;
    }

    return newValue;
};
