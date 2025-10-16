import { IUser } from '../users';
import { IRuleBreach, IRuleBreachPopulated } from './ruleBreach';

export interface IRuleBreachAlert extends Omit<IRuleBreach, 'originUserId'> {
    originUserId: string | null; // allow null for Cronjob rules (i.e. with getToday function)
}
export interface IRuleBreachAlertPopulated extends Omit<IRuleBreachPopulated, 'originUser'> {
    originUser: IUser | null;
}
