import * as mongoose from 'mongoose';
import config from '../../config';
import RuleBreachesModel from '../ruleBreaches/model';
import { IRuleBreachAlertDocument } from './interface';

const RuleBreachAlertsSchema = new mongoose.Schema({}, { versionKey: false });

const RuleBreachAlertsModel = RuleBreachesModel.discriminator<IRuleBreachAlertDocument>(
    config.mongo.ruleBreachAlertsSubCollectionName,
    RuleBreachAlertsSchema,
);

export default RuleBreachAlertsModel;
