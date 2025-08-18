import mongoose from 'mongoose';
import { ViewType } from '@microservices/shared';
import config from '../../config';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongoose';

const ChildTemplateSchema = new mongoose.Schema(
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
            type: mongoose.Schema.Types.ObjectId,
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
            enum: [ViewType.categoryPage, ViewType.userPage],
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
        filterByUnitUserField: {
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

ChildTemplateSchema.index({ displayName: 'text' });

ChildTemplateSchema.index({
    name: 'text',
    displayName: 'text',
    description: 'text',
});

ChildTemplateSchema.index({ parentTemplateId: 1 });

ChildTemplateSchema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], (res) => {
    transformResultDocsObjectIdKeysToString(res);
});

export default ChildTemplateSchema;
