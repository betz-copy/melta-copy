import { IActionMetadata, ActionTypes } from './actionMetadata';

export interface ICauseInstance {
    // same format of IVariable in Formula interfaces, but with instance ids
    entityId: string;
    aggregatedRelationship?: {
        relationshipId: string;
        otherEntityId: string;
    };
}

export interface ICausesOfInstance {
    instance: ICauseInstance;
    properties: string[]; // can be empty array, if the only cause is not related to specific property (i.e. count aggregation)
}

export interface IBrokenRule {
    ruleId: string;
    failures: Array<{ entityId: string; causes: ICausesOfInstance[] }>;
}

export interface IRuleBreach {
    originUserId: string;
    brokenRules: IBrokenRule[];
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
    createdAt: Date;
}
