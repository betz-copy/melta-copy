/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';
import config from '../../config';

const { maxFindLimit } = config.mongo;

// POST /api/semantic/group-count
export const getNotificationGroupCountRequestSchema = joi.object({
    query: {},
    body: joi.object({}),
    params: {},
});
