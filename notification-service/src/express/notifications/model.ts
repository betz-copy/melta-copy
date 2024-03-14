import mongoose from 'mongoose';
import { INotificationDocument } from './interface';
import config from '../../config';

const NotificationsSchema = new mongoose.Schema(
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
    },
    { timestamps: true, versionKey: false },
);

const NotificationsModel = mongoose.model<INotificationDocument>(config.mongo.notificationsCollectionName, NotificationsSchema);

export default NotificationsModel;
