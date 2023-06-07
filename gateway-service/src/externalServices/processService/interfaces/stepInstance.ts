import { IUser } from '../../../express/users/interface';
import { InstanceProperties, Status } from './processInstance';

export interface IStepInstance {
    templateId: string;
    properties?: InstanceProperties;
    status: Status;
    reviewers: string[];
    reviewerId?: string;
    reviewedAt?: string;
}

export interface IMongoStepInstance extends IStepInstance {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface IMongoStepInstancePopulated extends Omit<IMongoStepInstance, 'reviewerId' | 'reviewers'> {
    reviewers: IUser[];
    reviewer?: IUser;
}

export interface UpdateStepReqBody {
    properties?: InstanceProperties;
    statusReview?: {
        status: Status;
        reviewerId: string;
    };
}
