import * as mongoose from 'mongoose';
import config from '../../config';
import RuleBreachesModel from '../ruleBreaches/model';
import { IRuleBreachAlertDocument } from './interface';

const RuleBreachAlertsSchema = new mongoose.Schema({}, { versionKey: false });

const RuleBreachAlertsModel = RuleBreachesModel.discriminator<IRuleBreachAlertDocument>(
    config.mongo.ruleBreachAlertsCollectionName,
    RuleBreachAlertsSchema,
);

export default RuleBreachAlertsModel;
