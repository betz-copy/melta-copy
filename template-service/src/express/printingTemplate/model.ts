import mongoose from 'mongoose';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongoose';

const PrintSectionSchema = new mongoose.Schema(
    {
        categoryId: { type: String, required: true },
        entityTemplateId: { type: String, required: true },
        selectedColumns: { type: [String], required: true },
    },
    { _id: false },
);

const PrintingTemplateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        sections: {
            type: [PrintSectionSchema],
            required: true,
        },
        compactView: {
            type: Boolean,
            required: true,
        },
        addEntityCheckbox: {
            type: Boolean,
            required: true,
        },
        appendSignatureField: {
            type: Boolean,
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

PrintingTemplateSchema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], (res) => {
    transformResultDocsObjectIdKeysToString(res);
});

PrintingTemplateSchema.index({ name: 1 }, { unique: true });

export default PrintingTemplateSchema;
