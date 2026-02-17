import { IRuleBreachAlert } from '@packages/rule-breach';
import * as mongoose from 'mongoose';
import { defaultSchemaOptions, ruleBreachSchemaDefinition } from '../../utils/mongo/schemas/ruleBreach';

const RuleBreachAlertsSchema = new mongoose.Schema(ruleBreachSchemaDefinition, defaultSchemaOptions as mongoose.SchemaOptions<IRuleBreachAlert>);

export default RuleBreachAlertsSchema;
