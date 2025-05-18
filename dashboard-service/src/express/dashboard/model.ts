import mongoose from 'mongoose';
import config from '../../config';
import { DashboardItemType } from './interface';

const TableMetaDataSchema = new mongoose.Schema(
    {
        templateId: {
            type: String,
        },
        name: { type: String },
        description: { type: String },
        columns: { type: [String] },
        columnsOrder: { type: [String] },
        filters: { type: String },
    },
    { _id: false },
);

export const DashboardItemSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: Object.values(DashboardItemType),
            required: true,
        },
    },
    { timestamps: true, versionKey: false, minimize: false, discriminatorKey: 'type' },
);

DashboardItemSchema.discriminator(
    DashboardItemType.Table,
    new mongoose.Schema({
        metaData: TableMetaDataSchema,
    }),
);

DashboardItemSchema.discriminator(
    DashboardItemType.Iframe,
    new mongoose.Schema({
        metaData: {
            type: mongoose.Schema.Types.ObjectId,
            ref: config.mongo.iFramesCollectionName,
            required: true,
        },
    }),
);

DashboardItemSchema.discriminator(
    DashboardItemType.Chart,
    new mongoose.Schema({
        metaData: {
            type: mongoose.Schema.Types.ObjectId,
            ref: config.mongo.chartsCollectionName,
            required: true,
        },
    }),
);

// todo:add indexes
export default DashboardItemSchema;
