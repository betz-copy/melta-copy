import mongoose from 'mongoose';
import config from '../../config';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongoose';

export const EntityChildTemplateSchema = new mongoose.Schema(
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
        description: {
            type: String,
        },
        fatherTemplate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: config.mongo.entityTemplatesCollectionName,
            required: true,
            index: true,
        },
        categories: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: config.mongo.categoriesCollectionName,
            required: true,
            index: true,
        },
        propertiesFilters: {
            type: Object,
            required: true,
        },
        disabled: {
            type: Boolean,
            required: true,
            index: true,
        },
        actions: {
            type: String,
        },
        viewType: {
            type: String,
            enum: ['categoryPage', 'userPage'],
            required: true,
        },
        filterByCurrentUser: {
            type: Boolean,
            required: true,
            default: false,
        },
        filterByUserUnit: {
            type: Boolean,
            required: true,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        minimize: false,
    },
);

EntityChildTemplateSchema.index({ displayName: 'text' });

EntityChildTemplateSchema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], (res) => {
    transformResultDocsObjectIdKeysToString(res);
});
