import mongoose from 'mongoose';
import config from '../../config';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongoose';

const FieldGroupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            required: true,
        },
        fields: {
            type: [String],
            required: true,
        },
    },
    { _id: false },
);

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
        mapSearchProperties: {
            type: [String],
        },
        fieldGroups: {
            type: [FieldGroupSchema],
        },
    },
    {
        timestamps: true,
        versionKey: false,
        minimize: false,
    },
);

EntityTemplateSchema.index({ displayName: 'text' });
EntityTemplateSchema.index({ 'fieldGroups.name': 1, name: 1 }, { unique: true });
EntityTemplateSchema.index({ 'fieldGroups.displayName': 1, name: 1 }, { unique: true });

EntityTemplateSchema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], (res) => {
    transformResultDocsObjectIdKeysToString(res);
});

export default EntityTemplateSchema;
