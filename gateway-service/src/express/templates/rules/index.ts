import {
    IArgument,
    IFormula,
    IVariable,
    isAggregationGroup,
    isCountAggFunction,
    isEquation,
    isGroup,
    isPropertyOfVariable,
    isRegularFunction,
} from '@microservices/shared';

export const getParametersOfArgument = (argument: IArgument): Array<{ variable: IVariable; property?: string }> => {
    if (isPropertyOfVariable(argument)) {
        const { variable, property } = argument;
        return [{ variable, property }];
    }

    if (isCountAggFunction(argument)) {
        const { variable } = argument;
        return [{ variable }];
    }

    if (isRegularFunction(argument)) {
        const { arguments: functionArguments } = argument;
        return functionArguments.flatMap(getParametersOfArgument);
    }

    return [];
};

export const getParametersOfFormula = (formula: IFormula): Array<{ variable: IVariable; property?: string }> => {
    if (isEquation(formula)) {
        const { lhsArgument, rhsArgument } = formula;

        return [...getParametersOfArgument(lhsArgument), ...getParametersOfArgument(rhsArgument)];
    }

    if (isGroup(formula) || isAggregationGroup(formula)) {
        return formula.subFormulas.flatMap(getParametersOfFormula);
    }

    throw new Error('formula not supported');
};
