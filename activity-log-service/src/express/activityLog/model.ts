import * as mongoose from 'mongoose';

import { Action, IActivityLog } from './interface';
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
        type: Action,
        required: true,
    },
    metadata: {
        type: Object,
        required: true,
    },
});

ActivityLogSchema.index({ entityId: 1, timestamp: -1 });

ActivityLogSchema.index({ entityId: 1, userId: 1 }, { unique: true, partialFilterExpression: { action: { $eq: 'VIEW_ENTITY' } } });

const ActivityLogModel = mongoose.model<IActivityLog & mongoose.Document>(config.mongo.activitiesCollectionName, ActivityLogSchema);

export default ActivityLogModel;
