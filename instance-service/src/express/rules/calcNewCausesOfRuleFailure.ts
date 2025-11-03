import {
    IAggregationGroup,
    IArgument,
    ICausesOfInstance,
    IEquation,
    IFormula,
    IGroup,
    IPropertyOfVariable,
    IRegularFunction,
    isAggregationGroup,
    isConstant,
    isCountAggFunction,
    isEquation,
    isGroup,
    isPropertyOfVariable,
    isRegularFunction,
    isSumAggFunction,
} from '@microservices/shared';
import { groupBy, isEqual } from 'lodash';
import filteredMap from '../../utils/filteredMap';
import { IRuleFailure } from './interfaces';
import { IFormulaCauses } from './interfaces/formulaWithCauses';
import { IArgumentCauses, IPropertyOfVariableCauses } from './interfaces/formulaWithCauses/argument';
import { ICause } from './interfaces/formulaWithCauses/cause';
import { IEquationCauses } from './interfaces/formulaWithCauses/equation';
import {
    ICountAggFunctionCauses,
    IGetTodayFunctionCause,
    IRegularFunctionCauses,
    ISumAggFunctionCauses,
} from './interfaces/formulaWithCauses/function';
import { IAggregationGroupCauses, IGroupCauses } from './interfaces/formulaWithCauses/group';

type NewAndOldCauses = { newCauses: (ICause | IGetTodayFunctionCause)[]; oldCauses: (ICause | IGetTodayFunctionCause)[] };

const getCausesOfPropertyOfVariable = (
    propertyOfVariableCauses: IPropertyOfVariableCauses,
    propertyOfVariableCausesBeforeAction: IPropertyOfVariableCauses | undefined,
    _propertyOfVariable: IPropertyOfVariable,
): NewAndOldCauses => {
    if (!propertyOfVariableCausesBeforeAction) {
        return { newCauses: [propertyOfVariableCauses.cause], oldCauses: [] };
    }

    if (!isEqual(propertyOfVariableCauses.cause, propertyOfVariableCausesBeforeAction.cause)) {
        // happens at property value change (update entity)
        return { newCauses: [propertyOfVariableCauses.cause], oldCauses: [] };
    }

    return { newCauses: [], oldCauses: [propertyOfVariableCauses.cause] };
};

const getCausesOfAggFunction = (
    aggFunctionCauses: ICountAggFunctionCauses | ISumAggFunctionCauses,
    aggFunctionCausesBeforeAction: (ICountAggFunctionCauses | ISumAggFunctionCauses) | undefined,
): NewAndOldCauses => {
    if (aggFunctionCauses.resultValue !== aggFunctionCausesBeforeAction?.resultValue) {
        return { newCauses: aggFunctionCauses.causes, oldCauses: [] };
    }

    const { newCauses = [], oldCauses = [] } = groupBy(aggFunctionCauses.causes, (cause) => {
        const isOld = aggFunctionCausesBeforeAction.causes.some((causeBeforeAction) => isEqual(cause, causeBeforeAction));
        return isOld ? 'oldCauses' : 'newCauses';
    });

    return { newCauses, oldCauses };
};

const getCausesOfGetTodayFunction = (
    getTodayFunctionCause: IGetTodayFunctionCause,
    getTodayFunctionCauseBeforeAction: IGetTodayFunctionCause | undefined,
) => {
    if (isEqual(getTodayFunctionCause.resultValue, getTodayFunctionCauseBeforeAction?.resultValue)) {
        return { newCauses: [], oldCauses: [getTodayFunctionCause] };
    }

    return { newCauses: [getTodayFunctionCause], oldCauses: [] };
};

const getCausesOfRegularFunction = (
    regularFunctionCauses: IRegularFunctionCauses,
    regularFunctionCausesBeforeAction: IRegularFunctionCauses | undefined,
    regularFunction: IRegularFunction,
): NewAndOldCauses => {
    if (regularFunction.functionType === 'getToday') {
        return getCausesOfGetTodayFunction(
            regularFunctionCauses as IGetTodayFunctionCause,
            regularFunctionCausesBeforeAction as IGetTodayFunctionCause | undefined,
        );
    }

    const argumentsNewCauses = regularFunctionCauses.arguments.map((argumentCauses, index) =>
        getNewCausesOfArgument(argumentCauses, regularFunctionCausesBeforeAction?.arguments[index], regularFunction.arguments[index]),
    );

    if (!isEqual(regularFunctionCauses.resultValue, regularFunctionCausesBeforeAction?.resultValue)) {
        return {
            newCauses: argumentsNewCauses.flatMap(({ newCauses, oldCauses }) => [...newCauses, ...oldCauses]),
            oldCauses: [],
        };
    }

    return {
        newCauses: argumentsNewCauses.flatMap(({ newCauses }) => newCauses),
        oldCauses: argumentsNewCauses.flatMap(({ oldCauses }) => oldCauses),
    };
};

export const getNewCausesOfArgument = (
    argumentCauses: IArgumentCauses,
    argumentCausesBeforeAction: IArgumentCauses | undefined,
    argument: IArgument,
): NewAndOldCauses => {
    if (isConstant(argument)) {
        return { newCauses: [], oldCauses: [] };
    }
    if (isPropertyOfVariable(argument)) {
        return getCausesOfPropertyOfVariable(
            argumentCauses as IPropertyOfVariableCauses,
            argumentCausesBeforeAction as IPropertyOfVariableCauses | undefined,
            argument,
        );
    }

    if (isCountAggFunction(argument)) {
        return getCausesOfAggFunction(argumentCauses as ICountAggFunctionCauses, argumentCausesBeforeAction as ICountAggFunctionCauses | undefined);
    }

    if (isSumAggFunction(argument)) {
        return getCausesOfAggFunction(argumentCauses as ISumAggFunctionCauses, argumentCausesBeforeAction as ISumAggFunctionCauses | undefined);
    }

    if (isRegularFunction(argument)) {
        return getCausesOfRegularFunction(
            argumentCauses as IRegularFunctionCauses,
            argumentCausesBeforeAction as IRegularFunctionCauses | undefined,
            argument,
        );
    }

    throw new Error('unexpected argument, must be constant/propertyOfVariable/countAggFunction/sumAggFunction/regularSumFunction');
};

export const getCausesOfEquation = (
    equationCauses: IEquationCauses,
    equationCausesBeforeAction: IEquationCauses | undefined,
    equation: IEquation,
): NewAndOldCauses => {
    const lhsArgumentNewCauses = getNewCausesOfArgument(equationCauses.lhsArgument, equationCausesBeforeAction?.lhsArgument, equation.lhsArgument);
    const rhsArgumentNewCauses = getNewCausesOfArgument(equationCauses.rhsArgument, equationCausesBeforeAction?.rhsArgument, equation.rhsArgument);

    if (equationCauses.resultValue !== equationCausesBeforeAction?.resultValue) {
        // if resultValue is new, then all causes are new.
        return {
            newCauses: [
                ...lhsArgumentNewCauses.newCauses,
                ...rhsArgumentNewCauses.newCauses,
                ...lhsArgumentNewCauses.oldCauses,
                ...rhsArgumentNewCauses.oldCauses,
            ],
            oldCauses: [],
        };
    }

    return {
        newCauses: [...lhsArgumentNewCauses.newCauses, ...rhsArgumentNewCauses.newCauses],
        oldCauses: [...lhsArgumentNewCauses.oldCauses, ...rhsArgumentNewCauses.oldCauses],
    };
};

export const getCausesOfGroup = (groupCauses: IGroupCauses, groupCausesBeforeAction: IGroupCauses | undefined, group: IGroup): NewAndOldCauses => {
    // already filtered in DB, but to make sure. if group is false, then all falsy subFormulas caused it. same goes to true
    const relevantSubFormulasCauses = groupCauses.subFormulas.filter(({ resultValue }) => groupCauses.resultValue === resultValue);

    const subFormulasNewCauses = relevantSubFormulasCauses.map((subFormulaCauses, index) =>
        getCausesOfFormula(subFormulaCauses, groupCausesBeforeAction?.subFormulas[index], group.subFormulas[index]),
    );

    if (groupCauses.resultValue !== groupCausesBeforeAction?.resultValue) {
        // if resultValue is new, then all causes are new
        return { newCauses: subFormulasNewCauses.flatMap(({ newCauses, oldCauses }) => [...newCauses, ...oldCauses]), oldCauses: [] };
    }

    return {
        newCauses: subFormulasNewCauses.flatMap(({ newCauses }) => newCauses),
        oldCauses: subFormulasNewCauses.flatMap(({ oldCauses }) => oldCauses),
    };
};

export const getCausesOfAggregationGroup = (
    aggGroupCauses: IAggregationGroupCauses,
    aggGroupCausesBeforeAction: IAggregationGroupCauses | undefined,
    aggGroup: IAggregationGroup,
): NewAndOldCauses => {
    // already filtered in DB, but to make sure. if agg group is false, then all falsy iterations caused it. same goes to true
    const relevantIterationsCauses = aggGroupCauses.iterations.filter(({ resultValue }) => aggGroupCauses.resultValue === resultValue);
    const iterationsNewAndOldCauses = relevantIterationsCauses.map((iteration) => {
        const iterationBeforeAction = aggGroupCausesBeforeAction?.iterations.find(({ instance }) => isEqual(iteration.instance, instance));
        const { newCauses: newCausesOfGroup, oldCauses: oldCausesOfGroup } = getCausesOfGroup(iteration, iterationBeforeAction, {
            isGroup: true,
            ruleOfGroup: aggGroup.ruleOfGroup,
            subFormulas: aggGroup.subFormulas,
        });

        const instanceOfIterationCause: ICause = {
            instance: iteration.instance,
        };

        if (iteration.resultValue !== iterationBeforeAction?.resultValue) {
            // then oldCausesOfGroup should be empty anyways, but using it just in case
            return { newCauses: [...newCausesOfGroup, instanceOfIterationCause], oldCauses: oldCausesOfGroup };
        }

        return { newCauses: [...newCausesOfGroup], oldCauses: [...oldCausesOfGroup, instanceOfIterationCause] };
    });

    if (aggGroupCauses.resultValue !== aggGroupCausesBeforeAction?.resultValue) {
        return { newCauses: iterationsNewAndOldCauses.flatMap(({ newCauses, oldCauses }) => [...newCauses, ...oldCauses]), oldCauses: [] };
    }

    return {
        newCauses: iterationsNewAndOldCauses.flatMap(({ newCauses }) => newCauses),
        oldCauses: iterationsNewAndOldCauses.flatMap(({ oldCauses }) => oldCauses),
    };
};

export const getCausesOfFormula = (
    formulaCauses: IFormulaCauses,
    formulaCausesBeforeAction: IFormulaCauses | undefined,
    formula: IFormula,
): NewAndOldCauses => {
    if (isGroup(formula)) {
        return getCausesOfGroup(formulaCauses as IGroupCauses, formulaCausesBeforeAction as IGroupCauses | undefined, formula);
    }

    if (isEquation(formula)) {
        return getCausesOfEquation(formulaCauses as IEquationCauses, formulaCausesBeforeAction as IEquationCauses | undefined, formula);
    }

    if (isAggregationGroup(formula)) {
        return getCausesOfAggregationGroup(
            formulaCauses as IAggregationGroupCauses,
            formulaCausesBeforeAction as IAggregationGroupCauses | undefined,
            formula,
        );
    }

    throw new Error('unexpected formula, must be group/equation/aggeregationGroup');
};

const buildCausesOfInstancesFromArray = (causes: (ICause | IGetTodayFunctionCause)[]): (ICausesOfInstance | IGetTodayFunctionCause)[] => {
    const { instancesCauses = [], getTodayFunctionCauses = [] } = groupBy(causes, (cause) => {
        return 'instance' in cause ? 'instancesCauses' : 'getTodayFunctionCauses';
    }) as { instancesCauses: ICause[]; getTodayFunctionCauses: IGetTodayFunctionCause[] };

    const causesPerInstance = groupBy(instancesCauses, ({ instance: { entityId, aggregatedRelationship } }) =>
        aggregatedRelationship ? `${entityId}.${aggregatedRelationship.relationshipId}.${aggregatedRelationship.otherEntityId}` : entityId,
    );

    const causesOfInstances = Object.values(causesPerInstance).map((causesArrOfInstance) => {
        const properties = filteredMap(causesArrOfInstance, ({ property }) => ({ include: Boolean(property), value: property! }));

        const propertiesUnique = [...new Set(properties)];

        return { instance: causesArrOfInstance[0].instance, properties: propertiesUnique };
    });

    if (getTodayFunctionCauses.length > 0) {
        // all getToday causes are the same value, but different occurrences
        return [...causesOfInstances, getTodayFunctionCauses[0]];
    }
    return causesOfInstances;
};

export const getCausesOfRuleFailure = (
    ruleFailure: IRuleFailure,
    ruleFailureBeforeAction: IRuleFailure | undefined,
    formula: IFormula,
): (ICausesOfInstance | IGetTodayFunctionCause)[] => {
    const { newCauses } = getCausesOfFormula(ruleFailure.formulaCauses, ruleFailureBeforeAction?.formulaCauses, formula);

    const newCausesOfInstances = buildCausesOfInstancesFromArray(newCauses);

    return newCausesOfInstances;
};
