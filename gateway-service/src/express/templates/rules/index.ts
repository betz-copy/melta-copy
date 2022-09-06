import { isAggregationGroup, isCountAggFunction, isEquation, isGroup } from './interfaces';
import { IArgument, isPropertyOfVariable } from './interfaces/argument';
import { IFormula } from './interfaces/formula';

export const getParametersOfArgument = (argument: IArgument) => {
    if (isPropertyOfVariable(argument)) {
        const { variableName, property } = argument;
        return [{ variableName, property }];
    }

    if (isCountAggFunction(argument)) {
        const { variableName } = argument;
        return [{ variableName }];
    }

    return [];
};

export const getParametersOfFormula = (formula: IFormula) => {
    if (isEquation(formula)) {
        const { lhsArgument, rhsArgument } = formula;

        return [...getParametersOfArgument(lhsArgument), ...getParametersOfArgument(rhsArgument)];
    }

    if (isGroup(formula) || isAggregationGroup(formula)) {
        return formula.subFormulas.flatMap(getParametersOfFormula);
    }

    throw new Error('formula not supported');
};
