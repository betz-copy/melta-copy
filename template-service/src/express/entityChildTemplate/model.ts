import mongoose from 'mongoose';
import config from '../../config';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongoose';

const EntityChildTemplateSchema = new mongoose.Schema(
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
        parentTemplateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: config.mongo.entityTemplatesCollectionName,
            required: true,
            index: true,
        },
        category: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: config.mongo.categoriesCollectionName,
            required: true,
            index: true,
        },
        properties: {
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
        isFilterByCurrentUser: {
            type: Boolean,
            required: true,
            default: false,
        },
        filterByCurrentUserField: {
            type: String,
        },
        isFilterByUserUnit: {
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

EntityChildTemplateSchema.index({
    name: 'text',
    displayName: 'text',
    description: 'text',
});

EntityChildTemplateSchema.index({ parentTemplateId: 1 });

EntityChildTemplateSchema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], (res) => {
    transformResultDocsObjectIdKeysToString(res);
});

export default EntityChildTemplateSchema;
