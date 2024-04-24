import * as mongoose from 'mongoose';
import config from '../../config';
import { defaultSchemaOptions, ruleBreachSchemaDefinition } from '../../utils/mongo/schemas/ruleBreach';
import { IRuleBreachRequest } from './interface';

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

const RuleBreachRequestsModel = mongoose.model<IRuleBreachRequest>(config.mongo.ruleBreachRequestsCollectionName, RuleBreachRequestsSchema);

export default RuleBreachRequestsModel;
