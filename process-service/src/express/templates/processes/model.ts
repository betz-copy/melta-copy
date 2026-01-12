import mongoose from 'mongoose';
import config from '../../../config';

export const ProcessTemplateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            required: true,
        },
        details: {
            type: Object,
            required: true,
        },
        steps: [
            {
                type: String,
                ref: config.mongo.stepTemplatesCollectionName,
                required: true,
            },
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

ProcessTemplateSchema.index({ name: 1 }, { unique: true });
ProcessTemplateSchema.index({ displayName: 1 }, { unique: true });
