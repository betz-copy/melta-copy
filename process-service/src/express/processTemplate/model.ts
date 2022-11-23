import * as mongoose from 'mongoose';
import { IProcessTemplate, IProcessStepTemplate } from './interface';
import config from '../../config';

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
        description: {
            type: Object,
            require: true,
        },
        steps: {
            type: Array<IProcessStepTemplate>,
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

ProcessTemplateSchema.index({ name: 1 }, { unique: true });
ProcessTemplateSchema.index({ displayName: 1 }, { unique: true });

const ProcessTemplateModel = mongoose.model<IProcessTemplate & mongoose.Document>(config.mongo.processTemplateCollectionName, ProcessTemplateSchema);

export default ProcessTemplateModel;
