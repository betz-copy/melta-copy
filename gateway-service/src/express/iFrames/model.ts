import * as mongoose from 'mongoose';
import { IFrameDocument } from './interface';

const IFrameSchema = new mongoose.Schema<IFrameDocument>(
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
            type: [String],
            required: true,
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

export default IFrameSchema;
