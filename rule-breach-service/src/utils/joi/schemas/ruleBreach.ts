import * as joi from 'joi';
import { mongoIdSchema } from '.';
import { ActionTypes } from '../../interfaces/actionMetadata';
import { validateActionMetadata } from '../validateActionMetadata';

export const brokenRulesSchema = joi
    .array()
    .items(
        joi.object({
            ruleId: mongoIdSchema.required(),
            relationshipsIds: joi.array().items(mongoIdSchema).required(),
        }),
    )
    .min(1);

export const ruleBreachSchema = joi.object({
    originUserId: mongoIdSchema.required(),
    brokenRules: brokenRulesSchema.required(),
    actionType: joi
        .string()
        .valid(...Object.values(ActionTypes))
        .required(),
    actionMetadata: joi.custom(validateActionMetadata).required(),
});
