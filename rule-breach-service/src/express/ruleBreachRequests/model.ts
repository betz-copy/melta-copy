import mongoose from 'mongoose';
import config from '../../config';
import { defaultSchemaOptions, ruleBreachSchemaDefinition } from '../../utils/mongoose/schemas/ruleBreach';
import { IRuleBreachRequestDocument } from './interface';

const RuleBreachRequestsSchema = new mongoose.Schema(
    {
        ...ruleBreachSchemaDefinition,
        reviewerId: {
            type: String,
        },
        reviewedAt: {
            type: Date,
        },
        status: {
            type: String,
        },
    },
    defaultSchemaOptions,
);

const RuleBreachRequestsModel = mongoose.model<IRuleBreachRequestDocument>(config.mongo.ruleBreachRequestsCollectionName, RuleBreachRequestsSchema);

export default RuleBreachRequestsModel;
