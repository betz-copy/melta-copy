import { IUser } from '../../services/kartoffelService';
import { IRelationshipPopulated } from '../relationships';
import { ActionTypes, IActionMetadata, IActionMetadataPopulated } from './actionMetadata';

export interface IRuleBreach {
    _id: string;
    originUserId: string;
    brokenRules: {
        ruleId: string;
        relationshipIds: string[];
    }[];
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
    createdAt: Date;
}

export interface IRuleBreachPopulated {
    _id: string;
    originUser: IUser;
    brokenRules: {
        ruleId: string;
        relationships: (IRelationshipPopulated | null)[];
    }[];
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
    createdAt: Date;
}
