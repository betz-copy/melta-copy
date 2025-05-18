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
        fatherTemplateId: {
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
        defaults: {
            type: Object,
            required: true,
        },
        filters: {
            type: Object,
            required: true,
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

EntityChildTemplateSchema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], (res) => {
    transformResultDocsObjectIdKeysToString(res);
});

export default EntityChildTemplateSchema;
