import * as mongoose from 'mongoose';

import { IFrameDocument } from './interface';
import config from '../../config';
import { ServiceError } from '../error';

const IFrameSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        url: {
            type: String,
            required: true,
        },
        categoryIds: {
            type: [String],
            require: true,
        },
        apiToken: {
            type: String,
            require: false,
        },
        height: {
            type: Number,
            require: false,
        },
        width: {
            type: Number,
            require: false,
        },
        placeInSideBar: {
            type: Boolean,
            require: false,
        },
    },
    { timestamps: true, versionKey: false },
);

const handleMongooseDuplicateKeyError = (error: any, _doc: mongoose.Document, next: mongoose.HookNextFunction) => {
    if (error.name === 'MongoError' && error.code === 11000) {
        next(new ServiceError(400, 'iFrame with the same name already exists'));
    } else {
        next(error);
    }
};

IFrameSchema.post('save', handleMongooseDuplicateKeyError);
IFrameSchema.post('findOneAndUpdate', handleMongooseDuplicateKeyError);

const IFrameModel = mongoose.model<IFrameDocument>(config.mongo.iFramesCollectionName, IFrameSchema);

export default IFrameModel;
