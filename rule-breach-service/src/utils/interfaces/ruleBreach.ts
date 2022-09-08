import { IActionMetadata, ActionTypes } from './actionMetadata';

export interface IBrokenRule {
    ruleId: string;
    relationshipIds: string[];
}

export interface IRuleBreach {
    originUserId: string;
    brokenRules: IBrokenRule[];
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
    createdAt: Date;
}
