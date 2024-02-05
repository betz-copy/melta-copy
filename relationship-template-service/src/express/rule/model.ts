import * as mongoose from 'mongoose';

import config from '../../config';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongoose';
import { IRule } from './interfaces';

const RuleTemplateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        actionOnFail: {
            type: String,
            enum: ['WARNING', 'ENFORCEMENT'],
            required: true,
        },
        relationshipTemplateId: {
            type: String,
            required: true,
        },
        pinnedEntityTemplateId: {
            type: String,
            required: true,
        }, // sourceEntityTemplate or destinationEntityTemplate
        unpinnedEntityTemplateId: {
            type: String,
            required: true,
        },
        formula: {
            type: Object,
            required: true,
        },
        disabled: {
            type: Boolean,
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

RuleTemplateSchema.post(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete'], (res) => {
    transformResultDocsObjectIdKeysToString(res);
});

const RuleModel = mongoose.model<IRule>(config.mongo.ruleCollectionName, RuleTemplateSchema);

// const RuleConnModel = (db: string) => mongoose.connections[db].model<IRule & mongoose.Document>(config.mongo.ruleCollectionName, RuleTemplateSchema);

export default RuleModel;
