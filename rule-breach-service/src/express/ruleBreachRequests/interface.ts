import { Document } from 'mongoose';
import { IRuleBreach } from '../../utils/interfaces/ruleBreach';

export interface IRuleBreachRequest extends IRuleBreach {
    reviewerId?: string;
    reviewedAt?: Date;
    approved?: boolean;
}

export type IRuleBreachRequestDocument = IRuleBreachRequest & Document;
