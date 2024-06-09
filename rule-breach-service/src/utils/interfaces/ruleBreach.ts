import { IActionMetadata, ActionTypes } from './actionMetadata';

export interface IBrokenRule {
    ruleId: string;
    relationshipIds: string[];
}

export interface IAction {
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
}

export interface IRuleBreach {
    originUserId: string;
    actions: IAction[];
    brokenRules: IBrokenRule[];
    createdAt: Date;
}
