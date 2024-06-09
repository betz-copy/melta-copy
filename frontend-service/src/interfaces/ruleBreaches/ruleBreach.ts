import { IUser } from '../../services/kartoffelService';
import { IRelationshipPopulated } from '../relationships';
import { ActionTypes, IActionMetadata, IActionMetadataPopulated } from './actionMetadata';

export interface IRuleBreach {
    _id: string;
    originUserId: string;
    actions: {
        actionType: ActionTypes;
        actionMetadata: IActionMetadata;
    }[];
    brokenRules: {
        ruleId: string;
        relationshipIds: string[];
    }[];
    createdAt: Date;
}

export interface IRuleBreachPopulated {
    _id: string;
    originUser: IUser;
    brokenRules: {
        ruleId: string;
        relationships: (IRelationshipPopulated | string | null)[];
    }[];
    actions: {
        actionType: ActionTypes;
        actionMetadata: IActionMetadataPopulated;
    }[];
    createdAt: Date;
}

export type BreachType = 'alert' | 'request';
