/* eslint-disable import/prefer-default-export */

import { Document } from 'mongoose';
import { ServiceError } from '../express/error';

export const handleMongooseDuplicateKeyError = (error: any, _doc: Document, next: (err?: any) => void) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new ServiceError(400, 'permission with the same resourceType, userId and category already exists'));
    } else {
        next(error);
    }
};
