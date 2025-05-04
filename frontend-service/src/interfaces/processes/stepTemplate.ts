import { IUser } from '../users';
import { IProcessDetails } from './processTemplate';

export interface IStepTemplate extends IProcessDetails {
    name: string;
    displayName: string;
    reviewers: string[];
    iconFileId: string | null;
}

export interface IMongoStepTemplate extends IStepTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoStepTemplatePopulated extends Omit<IMongoStepTemplate, 'reviewers'> {
    reviewers: IUser[]; // TODO check if need to be IKartoffelUser or IUser
}
