import * as mongoose from 'mongoose';
import { IMongoIFrame } from '@microservices/shared';

const IFrameSchema = new mongoose.Schema<IMongoIFrame>(
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
