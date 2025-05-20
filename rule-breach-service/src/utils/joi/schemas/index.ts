/* eslint-disable import/prefer-default-export */
import * as joi from 'joi';

export const mongoIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');
