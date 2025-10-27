import { IMongoIframe } from '@microservices/shared';
import * as mongoose from 'mongoose';

const IFrameSchema = new mongoose.Schema<IMongoIframe>(
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

IFrameSchema.index({ name: 1, url: 1 });

export default IFrameSchema;
