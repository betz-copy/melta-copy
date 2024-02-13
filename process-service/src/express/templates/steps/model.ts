import * as mongoose from 'mongoose';
import config from '../../../config';
import { IStepTemplate } from './interface';

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

const StepTemplateModel = mongoose.model<IStepTemplate>(config.mongo.stepTemplatesCollectionName, StepTemplateSchema);

export default StepTemplateModel;
