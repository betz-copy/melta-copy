import { IUser } from '../users';
import { IRuleBreach, IRuleBreachPopulated } from './ruleBreach';

export enum RuleBreachRequestStatus {
    Pending = 'pending',
    Approved = 'approved',
    Denied = 'denied',
    Canceled = 'canceled',
}

export interface IRuleBreachRequest extends IRuleBreach {
    reviewerId?: string;
    reviewedAt?: Date;
    status: RuleBreachRequestStatus;
}

export interface IRuleBreachRequestPopulated extends IRuleBreachPopulated {
    reviewer?: IUser;
    reviewedAt?: Date;
    status: RuleBreachRequestStatus;
}
