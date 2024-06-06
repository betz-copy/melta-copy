import * as mongoose from 'mongoose';
import config from '../../../config';
import { IProcessInstance, Status } from './interface';

const ProcessInstanceSchema = new mongoose.Schema<IProcessInstance>(
    {
        templateId: {
            type: String,
            required: true,
            ref: config.mongo.processTemplatesCollectionName,
        },
        name: {
            type: String,
            required: true,
        },
        details: {
            type: Object,
            required: true,
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: {
            type: String,
            default: Status.Pending,
        },
        archived: {
            type: Boolean,
            default: false,
        },
        reviewedAt: { type: Date },
        reviewerId: { type: String },
        steps: [
            {
                type: String,
                ref: config.mongo.stepInstancesCollectionName,
                required: true,
            },
        ],
    },
    {
        timestamps: true,
        versionKey: false,
        minimize: false,
    },
);

ProcessInstanceSchema.index({ name: 1 }, { unique: true });
const ProcessInstanceModel = mongoose.model<IProcessInstance>(config.mongo.processInstancesCollectionName, ProcessInstanceSchema);

export default ProcessInstanceModel;
