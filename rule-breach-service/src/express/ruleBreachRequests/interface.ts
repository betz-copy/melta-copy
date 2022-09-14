import { Document } from 'mongoose';
import { IRuleBreach } from '../../utils/interfaces/ruleBreach';

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

export type IRuleBreachRequestDocument = IRuleBreachRequest & Document;
