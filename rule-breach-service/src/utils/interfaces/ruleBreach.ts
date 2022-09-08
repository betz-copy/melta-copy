import { IActionMetadata, ActionTypes } from './actionMetadata';

export interface IBrokenRule {
    ruleId: string;
    relationshipsIds: string[];
}

export interface IRuleBreach {
    originUserId: string;
    brokenRules: IBrokenRule[];
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
    createdAt: Date;
}
