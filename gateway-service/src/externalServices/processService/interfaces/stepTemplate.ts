import { IUser } from '../../../express/users/interface';
import { IProcessDetails } from './processTemplate';

export interface IStepTemplate extends IProcessDetails {
    name: string;
    displayName: string;
    reviewers: string[];
    iconFileId: string | null;
}

export interface IMongoStepTemplate extends IStepTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface IMongoStepTemplatePopulated extends Omit<IMongoStepTemplate, 'reviewers'> {
    reviewers: IUser[];
}
