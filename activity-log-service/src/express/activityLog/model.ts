import * as mongoose from 'mongoose';
import { ActionsLog } from '@microservices/shared';

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
        enum: ActionsLog,
    },
    metadata: {
        type: Object,
        required: true,
    },
});

ActivityLogSchema.index({ entityId: 1, timestamp: -1 });

ActivityLogSchema.index({ entityId: 1, userId: 1 }, { unique: true, partialFilterExpression: { action: { $eq: 'VIEW_ENTITY' } } });

export default ActivityLogSchema;
