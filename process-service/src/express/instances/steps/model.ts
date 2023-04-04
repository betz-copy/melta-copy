import * as mongoose from 'mongoose';
import { IStepInstance, StepInstanceDocument } from './interface';
import config from '../../../config';
import { Status } from '../processes/interface';

const StepInstanceSchema = new mongoose.Schema<IStepInstance>(
    {
        templateId: {
            type: String,
            required: true,
            ref: config.mongo.stepTemplateCollectionName,
        },
        status: {
            type: String,
            default: Status.Pending,
        },
        properties: { type: Object },
        reviewers: { type: Array<String> },
        reviewerId: { type: String },
        reviewedAt: { type: Date },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

const StepInstanceModel = mongoose.model<StepInstanceDocument>(config.mongo.stepInstanceCollectionName, StepInstanceSchema);

export default StepInstanceModel;
