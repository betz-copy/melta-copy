import Joi from 'joi';
import { Action } from './interfaces';

export const requestSchema = Joi.object({
    action: Joi.valid(...Object.values(Action)).required(),
    templateId: Joi.string().when('action', {
        is: Action.upsertGlobalIndex,
        then: Joi.forbidden(),
        otherwise: Joi.required(),
    }),
});
