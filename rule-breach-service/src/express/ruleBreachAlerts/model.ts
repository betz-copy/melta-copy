import * as mongoose from 'mongoose';
import config from '../../config';
import { defaultSchemaOptions, ruleBreachSchemaDefinition } from '../../utils/mongoose/schemas/ruleBreach';
import { IRuleBreachAlert } from './interface';

const RuleBreachAlertsSchema = new mongoose.Schema(ruleBreachSchemaDefinition, defaultSchemaOptions);

const RuleBreachAlertsModel = mongoose.model<IRuleBreachAlert>(config.mongo.ruleBreachAlertsCollectionName, RuleBreachAlertsSchema);

export default RuleBreachAlertsModel;
