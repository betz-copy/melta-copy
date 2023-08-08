import * as mongoose from 'mongoose';
import { IProcessInstance, ProcessInstanceDocument, Status } from './interface';
import config from '../../../config';

const ProcessInstanceSchema = new mongoose.Schema<IProcessInstance>(
    {
        templateId: {
            type: String,
            required: true,
            ref: config.mongo.processTemplateCollectionName,
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
        steps: [
            {
                type: String,
                ref: config.mongo.stepInstanceCollectionName,
                required: true,
            },
        ],
        status: {
            type: String,
            default: Status.Pending,
        },
        reviewerId: { type: String },
        reviewedAt: { type: Date },
        summaryDetails: { type: Object },
    },
    {
        timestamps: true,
        versionKey: false,
        minimize: false,
    },
);

ProcessInstanceSchema.index({ name: 1 }, { unique: true });
const ProcessInstanceModel = mongoose.model<ProcessInstanceDocument>(config.mongo.processInstanceCollectionName, ProcessInstanceSchema);

export default ProcessInstanceModel;
