import * as mongoose from 'mongoose';
import { IChartDocument } from './interface';
import config from '../../config';

const IChartSchema = new mongoose.Schema<IChartDocument>(
    {
        name: {
            type: String,
            required: true,
        },
        description: String,
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: config.mongo.entityTemplatesCollectionName,
            required: true,
            index: true,
        },
        type: {},
        typeMetaData: {},
        filters: {
            type: mongoose.Schema.Types.Mixed,
        },
        permission: {
            type: Boolean,
        },
        permissionMetaData: {},
        color: {
            type: String,
        },
        createdBy: {
            type: String,
        },
    },
    { timestamps: true, versionKey: false },
);

export default IChartSchema;
