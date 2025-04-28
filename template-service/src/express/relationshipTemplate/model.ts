import mongoose from 'mongoose';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongoose';

const RelationshipTemplateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        displayName: {
            type: String,
            required: true,
        },
        sourceEntityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        destinationEntityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        isProperty: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

RelationshipTemplateSchema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], (res) => {
    transformResultDocsObjectIdKeysToString(res);
});

RelationshipTemplateSchema.index({ name: 1, sourceEntityId: 1, destinationEntityId: 1 }, { unique: true });
RelationshipTemplateSchema.index({ displayName: 1, sourceEntityId: 1, destinationEntityId: 1 }, { unique: true });
RelationshipTemplateSchema.index({ sourceEntityId: 1 });
RelationshipTemplateSchema.index({ destinationEntityId: 1 });

export default RelationshipTemplateSchema;
