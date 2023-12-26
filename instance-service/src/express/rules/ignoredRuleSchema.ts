import Joi from 'joi';

export const ignoredRuleSchema = Joi.object({
    ruleId: Joi.string().required(),
    relationshipIds: Joi.array().items(Joi.string()).required(),
});
