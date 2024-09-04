import * as mongoose from 'mongoose';
import { defaultSchemaOptions, ruleBreachSchemaDefinition } from '../../utils/mongo/schemas/ruleBreach';

export const RuleBreachAlertsSchema = new mongoose.Schema(ruleBreachSchemaDefinition, defaultSchemaOptions);
