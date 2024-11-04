import mongoose, { connection } from 'mongoose';
import config from '../../config';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongo';
import { IMongoEntityTemplate } from './interface';

const { mongo } = config;
export const EntityTemplateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        displayName: {
            type: String,
            required: true,
            unique: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: config.mongo.categoriesCollectionName,
            required: true,
            index: true,
        },
        properties: {
            type: Object,
            required: true,
        },
        propertiesOrder: {
            type: [String],
            required: true,
        },
        propertiesTypeOrder: {
            type: [String],
            required: true,
        },
        propertiesPreview: {
            type: [String],
            required: true,
        },
        enumPropertiesColors: {
            type: Object,
        },
        disabled: {
            type: Boolean,
            required: true,
            index: true,
        },
        iconFileId: {
            type: String,
        },
        actions: {
            type: String,
        },
        documentTemplatesIds: {
            type: [String],
        },
    },
    {
        timestamps: true,
        versionKey: false,
        minimize: false,
    },
);

EntityTemplateSchema.index({ displayName: 'text' });

EntityTemplateSchema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], (res) => {
    transformResultDocsObjectIdKeysToString(res);
});

export const initModelPerWorkspace = (workspaceId: string) =>
    connection.useDb(workspaceId, { useCache: true }).model<IMongoEntityTemplate>(mongo.entityTemplatesCollectionName, EntityTemplateSchema);
