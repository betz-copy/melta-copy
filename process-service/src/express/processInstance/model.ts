import * as mongoose from 'mongoose';
import { IProcessInstance, IProcessStep } from './interface';
import config from '../../config';

const ProcessInstanceSchema = new mongoose.Schema<IProcessInstance>(
    {
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'process-templates',
        },
        details: {
            type: Object,
            required: true,
        },
        steps: {
            type: Array<IProcessStep>,
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

const ProcessTemplateModel = mongoose.model<IProcessInstance & mongoose.Document>(config.mongo.processInstanceCollectionName, ProcessInstanceSchema);

export default ProcessTemplateModel;
