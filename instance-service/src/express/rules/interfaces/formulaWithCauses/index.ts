import { IEquationCauses } from './equation';
import { IAggregationGroupCauses, IGroupCauses } from './group';

export type IFormulaCauses = IGroupCauses | IEquationCauses | IAggregationGroupCauses;
