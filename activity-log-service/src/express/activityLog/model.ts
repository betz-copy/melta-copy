import * as mongoose from 'mongoose';
import { Action } from './interface';

export const ActivityLogSchema = new mongoose.Schema({
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
        enum: [
            'DELETE_RELATIONSHIP',
            'CREATE_RELATIONSHIP',
            'UPDATE_ENTITY',
            'CREATE_ENTITY',
            'DUPLICATE_ENTITY',
            'DISABLE_ENTITY',
            'ACTIVATE_ENTITY',
            'VIEW_ENTITY',
        ],
    },
    metadata: {
        type: Object,
        required: true,
    },
});

ActivityLogSchema.index({ entityId: 1, userId: 1 }, { unique: true, partialFilterExpression: { action: { $eq: 'VIEW_ENTITY' } } });
