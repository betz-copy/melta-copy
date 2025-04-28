import * as mongoose from 'mongoose';
import { defaultSchemaOptions, ruleBreachSchemaDefinition } from '../../utils/mongo/schemas/ruleBreach';

const RuleBreachAlertsSchema = new mongoose.Schema(ruleBreachSchemaDefinition, defaultSchemaOptions);

export default RuleBreachAlertsSchema;
