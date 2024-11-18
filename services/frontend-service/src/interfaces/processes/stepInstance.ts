import { IUser } from '@microservices/shared';
import { InstanceProperties, Status } from './processInstance';

export interface IStepInstance {
    templateId: string;
    properties?: InstanceProperties;
    status: Status;
    reviewers: string[];
    reviewerId?: string;
    reviewedAt?: Date;
    comments?: string;
}

export interface IMongoStepInstance extends IStepInstance {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoStepInstancePopulated extends Omit<IMongoStepInstance, 'reviewerId' | 'reviewers'> {
    reviewers: IUser[]; // TODO check if need to be IKartoffelUser or IUser
    reviewer?: IUser;
}
