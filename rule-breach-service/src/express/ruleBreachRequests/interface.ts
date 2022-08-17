import { Document } from 'mongoose';
import { IRuleBreach } from '../ruleBreaches/interface';

export interface IRuleBreachRequest extends IRuleBreach {
    reviewerId?: string;
    reviewedAt?: Date;
    approved?: boolean;
}

export type IRuleBreachRequestDocument = IRuleBreachRequest & Document;
