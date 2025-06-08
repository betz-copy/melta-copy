import { IUser } from '../../user';
import { IProcessDetails } from './process';

export interface IStepTemplate extends IProcessDetails {
    name: string;
    displayName: string;
    reviewers: string[];
    disableAddingReviewers?: boolean;
    iconFileId: string | null;
}

export interface IMongoStepTemplate extends IStepTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoStepTemplatePopulated extends Omit<IMongoStepTemplate, 'reviewers'> {
    reviewers: IUser[];
}
