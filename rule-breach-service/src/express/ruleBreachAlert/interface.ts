import { Document } from 'mongoose';
import { IRuleBreach } from '../ruleBreaches/interface';

export interface IRuleBreachAlert extends IRuleBreach {}

export type IRuleBreachAlertDocument = IRuleBreachAlert & Document;
