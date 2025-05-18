import * as joi from 'joi';

// eslint-disable-next-line import/prefer-default-export
export const mongoIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');
