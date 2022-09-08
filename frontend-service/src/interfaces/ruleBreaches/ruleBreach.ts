import { IUser } from '../../services/kartoffelService';
import { IRelationshipPopulated } from '../relationships';
import { ActionTypes, IActionMetadata, IActionMetadataPopulated } from './actionMetadata';

export interface IRuleBreach {
    originUserId: string;
    brokenRules: {
        ruleId: string;
        relationshipIds: string[];
    }[];
    actionType: ActionTypes;
    actionMetadata: IActionMetadata;
    createdAt: Date;
}

// todo: make nullable population, if instances were deleted
export interface IRuleBreachPopulated {
    originUser: IUser;
    brokenRules: {
        ruleId: string;
        relationships: (IRelationshipPopulated | null)[];
    }[];
    actionType: ActionTypes;
    actionMetadata: IActionMetadataPopulated;
    createdAt: Date;
}
