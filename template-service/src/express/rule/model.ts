import mongoose from 'mongoose';

import { IMongoRule } from './interfaces';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongoose';
import config from '../../config';

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
        entityTemplateId: {
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

const RuleModel = mongoose.model<IMongoRule>(config.mongo.ruleCollectionName, RuleTemplateSchema);

export default RuleModel;
