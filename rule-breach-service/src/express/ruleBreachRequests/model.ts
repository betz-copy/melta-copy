import * as mongoose from 'mongoose';
import { defaultSchemaOptions, ruleBreachSchemaDefinition } from '../../utils/mongo/schemas/ruleBreach';

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

export default RuleBreachRequestsSchema;
