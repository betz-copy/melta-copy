import mongoose from 'mongoose';

export const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        displayName: {
            type: String,
            required: true,
            unique: true,
        },
        iconFileId: {
            type: String,
        },
        color: {
            type: String,
        },
        templateOrder: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

CategorySchema.index({ displayName: 'text' });
