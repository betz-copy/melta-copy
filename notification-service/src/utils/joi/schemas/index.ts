import * as joi from 'joi';

export const mongoIdSchema = joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid MongoId');
export const clientSideIdSchema = joi.string().regex(/^client-side-[0-9a-fA-F]{24}$/, 'valid client side Id');
