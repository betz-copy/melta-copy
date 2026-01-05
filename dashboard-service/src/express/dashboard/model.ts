import { DashboardItemType } from '@packages/dashboard';
import mongoose from 'mongoose';
import config from '../../config';

const TableMetaDataSchema = new mongoose.Schema(
    {
        templateId: { type: String, required: true },
        childTemplateId: { type: String },
        name: { type: String, required: true },
        description: { type: String },
        columns: { type: [String], required: true },
        filter: { type: String },
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

DashboardItemSchema.index({ type: 1 });

export default DashboardItemSchema;
