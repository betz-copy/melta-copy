import * as mongoose from 'mongoose';

import { IEntityTemplate } from './interface';
import config from '../../config';

const EntityTemplateSchema = new mongoose.Schema(
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
            ref: config.mongo.categoryCollectionName,
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
        propertiesPreview: {
            type: [String],
            required: true,
        },
        disabled: {
            type: Boolean,
            required: true,
            index: true,
        },
        iconFileId: {
            type: String,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        minimize: false,
    },
);

EntityTemplateSchema.index({ displayName: 'text' });

const EntityTemplateModel = mongoose.model<IEntityTemplate & mongoose.Document>(config.mongo.entityTemplateCollectionName, EntityTemplateSchema);

export default EntityTemplateModel;
