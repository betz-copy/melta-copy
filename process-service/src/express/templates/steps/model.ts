import mongoose from 'mongoose';

// eslint-disable-next-line import/prefer-default-export
export const StepTemplateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            required: true,
        },
        reviewers: {
            type: [String],
            required: true,
        },
        disableAddingReviewers: {
            type: Boolean,
            default: false,
        },
        properties: {
            type: Object,
            required: true,
        },
        propertiesOrder: {
            type: [String],
            required: true,
        },
        iconFileId: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);
