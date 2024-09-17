import { IUser } from '../../userService/interfaces/users';
import { InstanceProperties, Status } from './processInstance';

export interface IStepInstance {
    templateId: string;
    properties?: InstanceProperties;
    comments?: string;
    status: Status;
    reviewers: string[];
    reviewerId?: string;
    reviewedAt?: Date;
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
    processId?: string;
    properties?: InstanceProperties;
    comments?: string;
    statusReview?: {
        status: Status;
        reviewerId: string;
    };
}
