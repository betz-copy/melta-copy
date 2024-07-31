import * as mongoose from 'mongoose';
import { defaultSchemaOptions, ruleBreachSchemaDefinition } from '../../utils/mongo/schemas/ruleBreach';

export const RuleBreachRequestsSchema = new mongoose.Schema(
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
