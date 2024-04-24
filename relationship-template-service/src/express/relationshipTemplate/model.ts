import * as mongoose from 'mongoose';

import config from '../../config';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongo/mongoose';
import { IRelationshipTemplate } from './interface';

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

const RelationshipTemplateModel = mongoose.model<IRelationshipTemplate>(config.mongo.relationshipTemplatesCollectionName, RelationshipTemplateSchema);

export default RelationshipTemplateModel;
