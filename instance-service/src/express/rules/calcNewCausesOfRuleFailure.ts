import isEqual from 'lodash.isequal';
import groupBy from 'lodash.groupby';
import { IFormula } from '../../externalServices/templates/interfaces/rules/formula';
import { IEquation, isEquation } from '../../externalServices/templates/interfaces/rules/formula/equation';
import { IAggregationGroup, IGroup, isAggregationGroup, isGroup } from '../../externalServices/templates/interfaces/rules/formula/group';
import { ICausesOfInstance, IRuleFailure } from './interfaces';
import { IFormulaCauses } from './interfaces/formulaWithCauses';
import { ICause } from './interfaces/formulaWithCauses/cause';
import { IEquationCauses } from './interfaces/formulaWithCauses/equation';
import { IAggregationGroupCauses, IGroupCauses } from './interfaces/formulaWithCauses/group';
import { IArgument, IPropertyOfVariable, isConstant, isPropertyOfVariable } from '../../externalServices/templates/interfaces/rules/formula/argument';
import { IArgumentCauses, IPropertyOfVariableCauses } from './interfaces/formulaWithCauses/argument';
import {
    IRegularFunction,
    isCountAggFunction,
    isRegularFunction,
    isSumAggFunction,
} from '../../externalServices/templates/interfaces/rules/formula/function';
import { ICountAggFunctionCauses, IRegularFunctionCauses, ISumAggFunctionCauses } from './interfaces/formulaWithCauses/function';
import { filteredMap } from '../../utils/filteredMap';

const getCausesOfPropertyOfVariable = (
    propertyOfVariableCauses: IPropertyOfVariableCauses,
    propertyOfVariableCausesBeforeAction: IPropertyOfVariableCauses | undefined,
    _propertyOfVariable: IPropertyOfVariable,
): { newCauses: ICause[]; oldCauses: ICause[] } => {
    // console.log('getCausesOfPropertyOfVariable');

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
): { newCauses: ICause[]; oldCauses: ICause[] } => {
    if (aggFunctionCauses.resultValue !== aggFunctionCausesBeforeAction?.resultValue) {
        return { newCauses: aggFunctionCauses.causes, oldCauses: [] };
    }

    const { newCauses = [], oldCauses = [] } = groupBy(aggFunctionCauses.causes, (cause) => {
        const isOld = aggFunctionCausesBeforeAction.causes.some((causeBeforeAction) => isEqual(cause, causeBeforeAction));
        return isOld ? 'oldCauses' : 'newCauses';
    });

    return { newCauses, oldCauses };
};

const getCausesOfRegularFunction = (
    regularFunctionCauses: IRegularFunctionCauses,
    regularFunctionCausesBeforeAction: IRegularFunctionCauses | undefined,
    regularFunction: IRegularFunction,
): { newCauses: ICause[]; oldCauses: ICause[] } => {
    // console.log('getCausesOfRegularFunction');
    // console.dir({ regularFunctionCauses, regularFunctionCausesBeforeAction, regularFunction }, { depth: null });

    const argumentsNewCauses = regularFunctionCauses.arguments.map((argumentCauses, index) =>
        // eslint-disable-next-line no-use-before-define
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
): { newCauses: ICause[]; oldCauses: ICause[] } => {
    // console.log('getNewCausesOfArgument');
    // console.dir({ argumentCauses, argumentCausesBeforeAction, argument }, { depth: null });

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
    // console.log('isRegularFunction(argument)', isRegularFunction(argument));

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
): { newCauses: ICause[]; oldCauses: ICause[] } => {
    const lhsArgumentNewCauses = getNewCausesOfArgument(equationCauses.lhsArgument, equationCausesBeforeAction?.lhsArgument, equation.lhsArgument);
    const rhsArgumentNewCauses = getNewCausesOfArgument(equationCauses.rhsArgument, equationCausesBeforeAction?.rhsArgument, equation.rhsArgument);
    // console.dir({ lhsArgumentNewCauses, rhsArgumentNewCauses }, { depth: null });
    // console.dir({ equationCauses, equationCausesBeforeAction }, { depth: null });

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

export const getCausesOfGroup = (
    groupCauses: IGroupCauses,
    groupCausesBeforeAction: IGroupCauses | undefined,
    group: IGroup,
): { newCauses: ICause[]; oldCauses: ICause[] } => {
    // console.dir({ groupCauses, groupCausesBeforeAction }, { depth: null });

    // already filtered in DB, but to make sure. if group is false, then all falsy subFormulas caused it. same goes to true
    const relevantSubFormulasCauses = groupCauses.subFormulas.filter(({ resultValue }) => groupCauses.resultValue === resultValue);
    console.log('gelloooooo', { relevantSubFormulasCauses, groupCauses, groupCausesBeforeAction });

    const subFormulasNewCauses = relevantSubFormulasCauses.map((subFormulaCauses, index) =>
        // eslint-disable-next-line no-use-before-define
        getCausesOfFormula(subFormulaCauses, groupCausesBeforeAction?.subFormulas[index], group.subFormulas[index]),
    );
    // console.dir({ relevantSubFormulasCauses }, { depth: null });

    if (groupCauses.resultValue !== groupCausesBeforeAction?.resultValue) {
        // if resultValue is new, then all causes are new
        return { newCauses: subFormulasNewCauses.flatMap(({ newCauses, oldCauses }) => [...newCauses, ...oldCauses]), oldCauses: [] };
    }
    console.log('before return', { subFormulasNewCauses });

    return {
        newCauses: subFormulasNewCauses.flatMap(({ newCauses }) => newCauses),
        oldCauses: subFormulasNewCauses.flatMap(({ oldCauses }) => oldCauses),
    };
};

export const getCausesOfAggregationGroup = (
    aggGroupCauses: IAggregationGroupCauses,
    aggGroupCausesBeforeAction: IAggregationGroupCauses | undefined,
    aggGroup: IAggregationGroup,
): { newCauses: ICause[]; oldCauses: ICause[] } => {
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
): { newCauses: ICause[]; oldCauses: ICause[] } => {
    // console.dir({ formulaCauses, formulaCausesBeforeAction, formula }, { depth: null });

    if (isGroup(formula)) {
        // console.log('isGroup(formula)');
        return getCausesOfGroup(formulaCauses as IGroupCauses, formulaCausesBeforeAction as IGroupCauses | undefined, formula);
    }

    if (isEquation(formula)) {
        // console.log('isEquation(formula)');
        return getCausesOfEquation(formulaCauses as IEquationCauses, formulaCausesBeforeAction as IEquationCauses | undefined, formula);
    }

    if (isAggregationGroup(formula)) {
        // console.log('isAggregationGroup(formula)');
        return getCausesOfAggregationGroup(
            formulaCauses as IAggregationGroupCauses,
            formulaCausesBeforeAction as IAggregationGroupCauses | undefined,
            formula,
        );
    }

    throw new Error('unexpected formula, must be group/equation/aggeregationGroup');
};

const buildCausesOfInstancesFromArray = (causes: ICause[]): ICausesOfInstance[] => {
    const causesPerInstance = groupBy(causes, ({ instance: { entityId, aggregatedRelationship } }) =>
        aggregatedRelationship ? `${entityId}.${aggregatedRelationship.relationshipId}.${aggregatedRelationship.otherEntityId}` : entityId,
    );

    const causesOfInstances = Object.values(causesPerInstance).map((causesArrOfInstance) => {
        const properties = filteredMap(causesArrOfInstance, ({ property }) => ({ include: Boolean(property), value: property! }));

        const propertiesUnique = [...new Set(properties)];

        return { instance: causesArrOfInstance[0].instance, properties: propertiesUnique };
    });

    return causesOfInstances;
};

export const getCausesOfRuleFailure = (
    ruleFailure: IRuleFailure,
    ruleFailureBeforeAction: IRuleFailure | undefined,
    formula: IFormula,
): ICausesOfInstance[] => {
    // console.dir({ ruleFailure }, { depth: null });

    const { newCauses } = getCausesOfFormula(ruleFailure.formulaCauses, ruleFailureBeforeAction?.formulaCauses, formula);
    // console.dir({ newCauses }, { depth: null });

    const newCausesOfInstances = buildCausesOfInstancesFromArray(newCauses);
    // console.dir({ newCausesOfInstances }, { depth: null });

    return newCausesOfInstances;
};
