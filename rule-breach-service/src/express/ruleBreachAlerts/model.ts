import mongoose from 'mongoose';
import config from '../../config';
import { defaultSchemaOptions, ruleBreachSchemaDefinition } from '../../utils/mongoose/schemas/ruleBreach';
import { IRuleBreachAlertDocument } from './interface';

const RuleBreachAlertsSchema = new mongoose.Schema(ruleBreachSchemaDefinition, defaultSchemaOptions);

const RuleBreachAlertsModel = mongoose.model<IRuleBreachAlertDocument>(config.mongo.ruleBreachAlertsCollectionName, RuleBreachAlertsSchema);

export default RuleBreachAlertsModel;
