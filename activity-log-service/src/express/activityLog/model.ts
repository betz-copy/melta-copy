import * as mongoose from 'mongoose';

import { IActivityLog } from './interface';
import config from '../../config';

const ActivityLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
    },
    entityId: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: ['DELETE_RELATIONSHIP', 'CREATE_RELATIONSHIP', 'UPDATE_ENTITY', 'CREATE_ENTITY', 'DISABLE_ENTITY', 'ACTIVATE_ENTITY'],
    },
    metadata: {
        type: Object,
        required: true,
    },
});

ActivityLogSchema.index({ entityId: 1, timestamp: -1 });

const ActivityLogModel = mongoose.model<IActivityLog & mongoose.Document>(config.mongo.activityLogCollectionName, ActivityLogSchema);

export default ActivityLogModel;
