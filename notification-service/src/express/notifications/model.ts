import * as mongoose from 'mongoose';
import config from '../../config';
import { INotification } from './interface';

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

const NotificationsModel = mongoose.model<INotification>(config.mongo.notificationsCollectionName, NotificationsSchema);

export default NotificationsModel;
