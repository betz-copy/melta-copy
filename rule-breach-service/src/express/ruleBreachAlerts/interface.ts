import { Document } from 'mongoose';
import { IRuleBreach } from '../../utils/interfaces/ruleBreach';

export interface IRuleBreachAlert extends IRuleBreach {}

export type IRuleBreachAlertDocument = IRuleBreachAlert & Document;
