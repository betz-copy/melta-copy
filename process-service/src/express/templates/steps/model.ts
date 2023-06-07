import * as mongoose from 'mongoose';
import { IStepTemplate, StepTemplateDocument } from './interface';
import config from '../../../config';

const StepTemplateSchema = new mongoose.Schema<IStepTemplate>(
    {
        name: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            required: true,
        },
        reviewers: {
            type: [String],
            required: true,
        },
        properties: {
            type: Object,
            required: true,
        },
        propertiesOrder: {
            type: [String],
            required: true,
        },
        iconFileId: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

const StepTemplateModel = mongoose.model<StepTemplateDocument>(config.mongo.stepTemplateCollectionName, StepTemplateSchema);

export default StepTemplateModel;
