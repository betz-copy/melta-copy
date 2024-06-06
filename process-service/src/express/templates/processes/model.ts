import * as mongoose from 'mongoose';
import config from '../../../config';
import { IProcessTemplate } from './interface';

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
                ref: config.mongo.stepTemplatesCollectionName,
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

const ProcessTemplateModel = mongoose.model<IProcessTemplate>(config.mongo.processTemplatesCollectionName, ProcessTemplateSchema);

export default ProcessTemplateModel;
