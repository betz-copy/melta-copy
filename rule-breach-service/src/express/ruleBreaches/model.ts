import * as mongoose from 'mongoose';
import config from '../../config';
import { IRuleBreachDocument } from './interface';

const RuleBreachesSchema = new mongoose.Schema(
    {
        originUserId: {
            type: String,
            required: true,
        },
        brokenRules: {
            type: [
                {
                    ruleId: String,
                    relationshipsIds: [String],
                },
            ],
            required: true,
            _id: false,
        },
        actionType: {
            type: String,
            required: true,
        },
        actionMetadata: {
            type: Object,
            required: true,
        },
    },
    { timestamps: true, versionKey: false },
);

const RuleBreachesModel = mongoose.model<IRuleBreachDocument>(config.mongo.ruleBreachesCollectionName, RuleBreachesSchema);

export default RuleBreachesModel;
