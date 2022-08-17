import * as mongoose from 'mongoose';
import config from '../../config';
import RuleBreachesModel from '../ruleBreaches/model';
import { IRuleBreachRequestDocument } from './interface';

const RuleBreachRequestsSchema = new mongoose.Schema(
    {
        reviewerId: {
            type: String,
        },
        reviewedAt: {
            type: Date,
        },
        approved: {
            type: Boolean,
        },
    },
    { versionKey: false },
);

const RuleBreachRequestsModel = RuleBreachesModel.discriminator<IRuleBreachRequestDocument>(
    config.mongo.ruleBreachRequestsSubCollectionName,
    RuleBreachRequestsSchema,
);

export default RuleBreachRequestsModel;
