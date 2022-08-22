/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';
import { mongoIdSchema } from '../../utils/joi/schemas';
import { agGridRequestSchema } from '../../utils/joi/schemas/agGrid';

// POST /api/rule-breaches/search
export const searchRuleBreachesSchema = joi.object({
    query: {},
    body: {
        ...agGridRequestSchema,
        originUserId: mongoIdSchema,
    },
    params: {},
});
