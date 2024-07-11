import { IArgumentCauses } from './argument';

export interface IEquationCauses {
    lhsArgument: IArgumentCauses;
    rhsArgument: IArgumentCauses;
    resultValue: boolean;
}
