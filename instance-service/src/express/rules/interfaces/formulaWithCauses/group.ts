import { IFormulaCauses } from '.';
import { ICause } from './cause';

export interface IAggregationGroupCauses {
    iterations: Array<{
        instance: Required<ICause['instance']>;
        subFormulas: IFormulaCauses[];
        resultValue: boolean;
    }>;
    resultValue: boolean;
}

export interface IGroupCauses {
    subFormulas: IFormulaCauses[];
    resultValue: boolean;
}
