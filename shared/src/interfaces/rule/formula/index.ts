import { IEquation } from './equation';
import { IAggregationGroup, IGroup } from './group';

export type IFormula = IGroup | IEquation | IAggregationGroup;

export * from './argument';
export * from './equation';
export * from './function';
export * from './group';
