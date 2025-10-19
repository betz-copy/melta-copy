import mongoose from 'mongoose';
import { IChartType, IChartPermission } from '@microservices/shared';

export const ChartSchema = new mongoose.Schema(
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
        childTemplateId: {
            type: String,
        },
        permission: {
            type: String,
            enum: Object.values(IChartPermission),
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
ChartSchema.index({ templateId: 1, name: 1, description: 1 });

export default ChartSchema;
