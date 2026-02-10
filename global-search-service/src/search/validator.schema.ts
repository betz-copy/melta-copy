import { IndexingAction } from '@packages/global-search';
import Joi from 'joi';

export const requestSchema = Joi.object({
    action: Joi.valid(...Object.values(IndexingAction)).required(),
    templateId: Joi.string().when('action', {
        is: IndexingAction.upsertGlobalIndex,
        then: Joi.forbidden(),
        otherwise: Joi.required(),
    }),
});
