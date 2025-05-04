import { defaultValidationOptions } from '@microservices/shared';
import Joi from 'joi';

export const joiValidate = <T>(schema: Joi.AnySchema<any>, data: T, options: Joi.ValidationOptions = defaultValidationOptions): T => {
    const { error, value } = schema.validate(data, options);
    if (error) {
        throw error;
    }

    return value;
};
