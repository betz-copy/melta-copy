import { IActionMetadata, ActionTypes } from './actionMetadata';

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
