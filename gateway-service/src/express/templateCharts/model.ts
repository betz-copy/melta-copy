import * as mongoose from 'mongoose';
import { IChartDocument, IChartType, IPermission } from './interface';

const ChartSchema = new mongoose.Schema<IChartDocument>(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        type: {
            type: String,
            enum: Object.values(IChartType),
            required: true,
        },
        metaData: {
            type: Object,
            required: true,
        },
        templateId: {
            type: String,
            required: true,
            index: true,
        },
        permission: {
            type: String,
            enum: Object.values(IPermission),
            required: true,
        },
        createdBy: {
            type: String,
        },
        filter: {
            type: String, // todo: change to Object when upgrade mongoose version
        },
    },
    { timestamps: true, versionKey: false },
);

ChartSchema.index({ templateId: 1 });

export default ChartSchema;
