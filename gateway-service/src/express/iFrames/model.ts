import * as mongoose from 'mongoose';
import { IFrameDocument } from './interface';
import config from '../../config';

const IFrameSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        categoryIds: {
            type: [String] || String,
            require: true,
        },
        iconFileId: {
            type: String,
        },
        placeInSideBar: {
            type: Boolean,
        },
    },
    { timestamps: true, versionKey: false },
);

const IFrameModel = mongoose.model<IFrameDocument>(config.mongo.iFramesCollectionName, IFrameSchema);

export default IFrameModel;
