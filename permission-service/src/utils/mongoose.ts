/* eslint-disable import/prefer-default-export */

import { Document, HookNextFunction } from 'mongoose';
import { BadRequestError } from '../express/error';

export const handleMongooseDuplicateKeyError = (error: any, _doc: Document, next: HookNextFunction) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new BadRequestError('permission with the same resourceType, userId and category already exists'));
    } else {
        next(error);
    }
};
