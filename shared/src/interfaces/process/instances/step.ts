import { IPropertyValue } from '../../entity';
import { IUser } from '../../user';
import { InstanceProperties, Status } from './process';

export interface IStepInstance {
    templateId: string;
    properties?: Record<string, IPropertyValue>;
    comments?: string;
    status: Status;
    reviewers: string[];
    reviewerId?: string;
    reviewedAt?: Date;
}

export interface IMongoStepInstance extends IStepInstance {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMongoStepInstancePopulated extends Omit<IMongoStepInstance, 'reviewerId' | 'reviewers'> {
    reviewers: IUser[];
    reviewer?: IUser;
}

export interface UpdateStepReqBody {
    processId: string;
    properties?: InstanceProperties;
    comments?: string;
    statusReview?: {
        status: Status;
        reviewerId: string;
    };
}

export type IGenericStep = Pick<IMongoStepInstance, '_id' | 'reviewers'>;
export type IGenericStepPopulated = Pick<IMongoStepInstancePopulated, '_id' | 'reviewers'>;
