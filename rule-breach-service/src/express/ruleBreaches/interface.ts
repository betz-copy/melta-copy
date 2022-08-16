import { Document } from 'mongoose';
import { IActionMetadata, ActionTypes } from '../../utils/interfaces';

export interface IRuleBreach {
    originUserId: string;
    brokenRules: {
        ruleId: string;
        relationshipsIds: string[];
    }[];
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
    createdAt: Date;
}

export type IRuleBreachDocument = IRuleBreach & Document;
