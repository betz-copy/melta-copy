import { IRuleBreachRequest } from '@packages/rule-breach';
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
    defaultSchemaOptions as mongoose.SchemaOptions<IRuleBreachRequest>,
);

export default RuleBreachRequestsSchema;
