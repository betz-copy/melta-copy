import { Status } from '@packages/process';
import mongoose from 'mongoose';
import config from '../../../config';

export const StepInstanceSchema = new mongoose.Schema(
    {
        templateId: {
            type: String,
            required: true,
            ref: config.mongo.stepTemplatesCollectionName,
        },
        status: {
            type: String,
            default: Status.Pending,
        },
        properties: { type: Object },
        comments: { type: String },
        reviewers: { type: [String] },
        reviewerId: { type: String },
        reviewedAt: { type: Date },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);
