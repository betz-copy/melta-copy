import Joi from 'joi';

const causesOfInstanceSchema = Joi.object({
    instance: Joi.object({
        entityId: Joi.string().required(),
        aggregatedRelationship: Joi.object({
            relationshipId: Joi.string().required(),
            otherEntityId: Joi.string().required(),
        }),
    }).required(),
    properties: Joi.array().items(Joi.string()).required(),
});

export const brokenRuleSchema = Joi.object({
    ruleId: Joi.string().required(),
    failures: Joi.array()
        .items({
            entityId: Joi.string().required(),
            causes: Joi.array().items(causesOfInstanceSchema).required(),
        })
        .required(),
});
