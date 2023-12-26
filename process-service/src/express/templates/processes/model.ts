import * as mongoose from 'mongoose';
import { IProcessTemplate, ProcessTemplateDocument } from './interface';
import config from '../../../config';

const ProcessTemplateSchema = new mongoose.Schema<IProcessTemplate>(
    {
        name: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            required: true,
        },
        details: {
            type: Object,
            required: true,
        },
        steps: [
            {
                type: String,
                ref: config.mongo.stepTemplateCollectionName,
                required: true,
            },
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

ProcessTemplateSchema.index({ name: 1 }, { unique: true });
ProcessTemplateSchema.index({ displayName: 1 }, { unique: true });

const ProcessTemplateModel = mongoose.model<ProcessTemplateDocument>(config.mongo.processTemplateCollectionName, ProcessTemplateSchema);

export default ProcessTemplateModel;
