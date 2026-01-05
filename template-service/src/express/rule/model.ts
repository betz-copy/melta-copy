import { ActionOnFail } from '@packages/rule';
import mongoose from 'mongoose';
import { transformResultDocsObjectIdKeysToString } from '../../utils/mongoose';

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
            enum: ActionOnFail,
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
        fieldColor: { type: Object },
        mail: { type: Object },
        doesFormulaHaveTodayFunc: {
            type: Boolean,
            require: true,
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

export default RuleTemplateSchema;
