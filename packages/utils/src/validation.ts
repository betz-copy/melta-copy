import Joi from 'joi';

export const searchFilterSchema = Joi.object({
    $and: Joi.alternatives().try(Joi.object(), Joi.array().items(Joi.object())),
    $or: Joi.array().items(Joi.object()),
}).oxor('$and', '$or');

export const basicValidateRequest = <T = any>(schema: Joi.ObjectSchema, content: any): T => {
    const { error, value } = schema.validate(content, { abortEarly: false });
    if (error) {
        const errors = error.details.map((detail) => detail.message).join(', ');
        throw new Error(`Validation error: ${errors}`);
    }
    return value as T;
};
