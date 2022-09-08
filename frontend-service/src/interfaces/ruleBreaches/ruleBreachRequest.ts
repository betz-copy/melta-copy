import { IUser } from '../../services/kartoffelService';
import { IRuleBreach, IRuleBreachPopulated } from './ruleBreach';

export interface IRuleBreachRequest extends IRuleBreach {
    reviewerId?: string;
    reviewedAt?: Date;
    approved?: boolean;
}

export interface IRuleBreachRequestPopulated extends IRuleBreachPopulated {
    reviewer?: IUser;
    reviewedAt?: Date;
    approved?: boolean;
}
