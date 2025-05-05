import mongoose from 'mongoose';
import config from '../../config';
import { DashboardItemType, IPermission } from './interface';

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

const IframeMetaDataSchema = new mongoose.Schema(
    {
        iframeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: config.mongo.iFramesCollectionName,
            // required: isIframeItem,
        },
    },
    { _id: false },
);

const ChartMetaDataSchema = new mongoose.Schema(
    {
        chartId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: config.mongo.chartsCollectionName,
            // required: isChartItem,
        },
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
        permission: {
            type: String,
            enum: Object.values(IPermission),
            required: true,
        },
        createdBy: {
            type: String,
            // required: true,
        },
        iframeId: {
            type: String,
            ref: config.mongo.iFramesCollectionName,
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
        metaData: IframeMetaDataSchema,
    }),
);

DashboardItemSchema.discriminator(
    DashboardItemType.Chart,
    new mongoose.Schema({
        metaData: ChartMetaDataSchema,
    }),
);

// todo:add indexes
export default DashboardItemSchema;
