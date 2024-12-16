import * as mongoose from 'mongoose';

export const NotificationsSchema = new mongoose.Schema(
    {
        viewers: {
            type: [String],
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        metadata: {
            type: Object,
            required: true,
        },
        notificationDate: {
            type: Date,
        },
    },
    { timestamps: true, versionKey: false },
);
