import * as mongoose from 'mongoose';
import { IProcessInstance, ProcessInstanceDocument, Status } from './interface';
import config from '../../../config';

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
const ProcessInstanceModel = mongoose.model<ProcessInstanceDocument>(config.mongo.processInstancesCollectionName, ProcessInstanceSchema);

export default ProcessInstanceModel;
