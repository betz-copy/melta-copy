import {
    IEquation,
    IOperatorBool,
    isEquation,
    IMongoRule,
    IAggregationGroup,
    IGroup,
    isAggregationGroup,
    isGroup,
    IArgument,
    IConstant,
    IPropertyOfVariable,
    IVariable,
    isConstant,
    isPropertyOfVariable,
    IFormula,
    ICountAggFunction,
    IRegularFunction,
    ISumAggFunction,
    isCountAggFunction,
    isRegularFunction,
    isSumAggFunction,
    IMongoEntityTemplate,
} from '@microservices/shared';
import { getNeo4jDate } from '../../utils/neo4j/lib';
import { CypherQuery } from './interfaces';
import config from '../../config';

const {
    cypherRulesResultValueVariableNameSuffix: resultValueVariableNameSuffix,
    cypherRulesResultCausesVariableNameSuffix: resultCausesVariableNameSuffix,
} = config;

const generateNeo4jQueryFromCountAggFunction = (
    countAggFunction: ICountAggFunction,
    withVariablesForSubQueries: string[],
    resultVariableNamePrefix: string,
): CypherQuery => {
    const { entityTemplateId, aggregatedRelationship } = countAggFunction.variable;

    const resultValueVariableName = `${resultVariableNamePrefix}${resultValueVariableNameSuffix}`;
    const resultCausesVariableName = `${resultVariableNamePrefix}${resultCausesVariableNameSuffix}`;

    return {
        cypherCalculation: `
            CALL {
                with ${withVariablesForSubQueries.join(', ')}
                match (\`${entityTemplateId}\`)-[aggRelationship:\`${aggregatedRelationship.relationshipTemplateId}\`]-(aggEntity)
                with {
                    instance: {
                        entityId: \`${entityTemplateId}\`._id,
                        aggregatedRelationship: {
                            relationshipId: aggRelationship._id,
                            otherEntityId: aggEntity._id
                        }
                    }
                 } as cause
                with collect(cause) as causes
                WITH *, size(causes) as ${resultValueVariableName}
                WITH *, { causes: causes, resultValue: ${resultValueVariableName} } as ${resultCausesVariableName} // ICountAggFunctionCauses
                return ${resultCausesVariableName}, ${resultValueVariableName}
            }
        `,
        resultValueVariableName,
        resultCausesVariableName,
        parameters: {},
    };
};

const generateNeo4jQueryFromSumAggFunction = (
    sumAggFunction: ISumAggFunction,
    withVariablesForSubQueries: string[],
    resultVariableNamePrefix: string,
): CypherQuery => {
    const { entityTemplateId, aggregatedRelationship } = sumAggFunction.variable;

    const resultValueVariableName = `${resultVariableNamePrefix}${resultValueVariableNameSuffix}`;
    const resultCausesVariableName = `${resultVariableNamePrefix}${resultCausesVariableNameSuffix}`;

    return {
        cypherCalculation: `
            CALL {
                with ${withVariablesForSubQueries.join(', ')}
                match (\`${entityTemplateId}\`)-[aggRelationship:\`${aggregatedRelationship.relationshipTemplateId}\`]-(aggEntity)
                with {
                    instance: {
                        entityId: \`${entityTemplateId}\`._id,
                        aggregatedRelationship: {
                            relationshipId: aggRelationship._id,
                            otherEntityId: aggEntity._id
                        }
                    }
                    property: "${sumAggFunction.property}",
                    value: aggEntity.${sumAggFunction.property}
                } as cause
                with collect(cause) as causes
                with *, reduce(sumResult = 0, currCause IN causes | sumResult + currCause.value) as ${resultValueVariableName}
                WITH *, { causes: causes, resultValue: ${resultValueVariableName} } as ${resultCausesVariableName}, // ISumAggFunctionCauses
                return ${resultCausesVariableName}, ${resultValueVariableName}
            }
        `,
        resultValueVariableName,
        resultCausesVariableName,
        parameters: {},
    };
};

const generateNeo4jQueryFromRegularFunction = (
    func: IRegularFunction,
    withVariablesForSubQueries: string[],
    resultVariableNamePrefix: string,
    entityTemplate: IMongoEntityTemplate,
): CypherQuery => {
    const resultValueVariableName = `${resultVariableNamePrefix}${resultValueVariableNameSuffix}`;
    const resultCausesVariableName = `${resultVariableNamePrefix}${resultCausesVariableNameSuffix}`;

    const funcArguments = func.arguments.map((argument, index) =>
        // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->group->formulas)
        generateNeo4jQueryFromArgument(argument, withVariablesForSubQueries, `${resultVariableNamePrefix}argument${index}_`, entityTemplate),
    );
    if (func.functionType === 'toDate') {
        const [dateTimeArgument] = funcArguments;
        return {
            cypherCalculation: `
            ${dateTimeArgument.cypherCalculation}
            WITH *, date(${dateTimeArgument.resultValueVariableName}) as ${resultValueVariableName}
            WITH *, { arguments: [${dateTimeArgument.resultCausesVariableName}], resultValue: ${resultValueVariableName} } as ${resultCausesVariableName}
            `,
            resultValueVariableName,
            resultCausesVariableName,
            parameters: dateTimeArgument.parameters,
        };
    }
    if (
        func.functionType === 'addToDate' ||
        func.functionType === 'addToDateTime' ||
        func.functionType === 'subFromDate' ||
        func.functionType === 'subFromDateTime'
    ) {
        const [dateArgument, durationArgument] = funcArguments;

        const operator = func.functionType === 'addToDate' || func.functionType === 'addToDateTime' ? '+' : '-';

        return {
            cypherCalculation: `
            ${dateArgument.cypherCalculation}
            ${durationArgument.cypherCalculation}
            WITH *, ${dateArgument.resultValueVariableName} ${operator} ${durationArgument.resultValueVariableName} as ${resultValueVariableName},
            { arguments: [${dateArgument.resultCausesVariableName}, ${durationArgument.resultCausesVariableName}], resultValue: ${resultValueVariableName} } as ${resultCausesVariableName}
            `,
            resultValueVariableName,
            resultCausesVariableName,
            parameters: { ...dateArgument.parameters, ...durationArgument.parameters },
        };
    }
    if (func.functionType === 'getToday') {
        return {
            cypherCalculation: `
            WITH *, $getTodayFuncValue as ${resultValueVariableName}
            WITH *, { arguments: [], resultValue: ${resultValueVariableName} } as ${resultCausesVariableName}
            `,
            resultValueVariableName,
            resultCausesVariableName,
            parameters: {},
        };
    }

    throw new Error('invalid functionType, shouldnt reach here');
};

// duration is of format "[nY][nM][nD][nH]" (square brackets means optional)
const getDurationComponents = (duration: string): { Y?: number; M?: number; D?: number; H?: number } => {
    const numberRegExp = '[1-9]\\d*'; // digits that doesnt start with 0
    const componentRegExp = new RegExp(`(${numberRegExp})(Y|M|D|H)`, 'g');

    const components = duration.matchAll(componentRegExp);

    const durationComponentsEntries = Array.from(components).map((match) => {
        const [_, number, durationLetter] = match;
        return [durationLetter, Number(number)];
    });

    return Object.fromEntries(durationComponentsEntries);
};

const generateNeo4jQueryFromConstant = (constant: IConstant, resultVariableNamePrefix: string): CypherQuery => {
    let cypherCalculationResultValue: string;
    let parameters: CypherQuery['parameters'];

    const resultValueVariableName = `${resultVariableNamePrefix}${resultValueVariableNameSuffix}`;
    const resultCausesVariableName = `${resultVariableNamePrefix}${resultCausesVariableNameSuffix}`;

    if (constant.type === 'date') {
        cypherCalculationResultValue = `date($${resultValueVariableName})`;
        parameters = { [resultValueVariableName]: constant.value };
    } else if (constant.type === 'dateTime') {
        cypherCalculationResultValue = `localdatetime($${resultValueVariableName})`;
        parameters = { [resultValueVariableName]: constant.value };
    } else if (constant.type === 'string') {
        cypherCalculationResultValue = `$${resultValueVariableName}`;
        parameters = { [resultValueVariableName]: constant.value };
    } else if (constant.type === 'number') {
        cypherCalculationResultValue = `$${resultValueVariableName}`;
        parameters = { [resultValueVariableName]: constant.value };
    } else if (constant.type === 'boolean') {
        cypherCalculationResultValue = `$${resultValueVariableName}`;
        parameters = { [resultValueVariableName]: constant.value };
    } else if (constant.type === 'dateDuration' || constant.type === 'dateTimeDuration') {
        const durationComponents = getDurationComponents(constant.value as string);
        const { Y = 0, M = 0, D = 0, H = 0 } = durationComponents;

        cypherCalculationResultValue = `duration('P${Y}Y${M}M${D}DT${H}H')`;
        parameters = {};
    } else {
        throw new Error('unexpected constant type string/number/boolean');
    }

    return {
        cypherCalculation: `WITH *, ${cypherCalculationResultValue} as ${resultValueVariableName}, null as ${resultCausesVariableName}`,
        resultValueVariableName,
        resultCausesVariableName,
        parameters,
    };
};

const getVariableName = ({ entityTemplateId, aggregatedRelationship }: IVariable) => {
    if (!aggregatedRelationship) {
        return `\`${entityTemplateId}\``;
    }

    const { relationshipTemplateId, otherEntityTemplateId, variableNameSuffix } = aggregatedRelationship;

    const variableNameSuffixStr = variableNameSuffix ? `-${variableNameSuffix}` : '';

    return `\`${entityTemplateId}.${relationshipTemplateId}.${otherEntityTemplateId}${variableNameSuffixStr}\``;
};

const getAggregatedRelationshipName = ({
    entityTemplateId,
    aggregatedRelationship: { relationshipTemplateId, variableNameSuffix },
}: Required<IVariable>) => {
    const variableNameSuffixStr = variableNameSuffix ? `-${variableNameSuffix}` : '';

    return `\`${entityTemplateId}.${relationshipTemplateId}${variableNameSuffixStr}\``;
};

const getPropertyKey = (entityTemplate: IMongoEntityTemplate, propertyKey: string) => {
    const directProperty = entityTemplate.properties.properties[propertyKey];
    if (directProperty?.format === 'relationshipReference' && directProperty.relationshipReference) {
        return `${propertyKey}.properties.${directProperty.relationshipReference.relatedTemplateField}_reference`;
    }

    if (propertyKey.includes('.') && propertyKey.includes('_reference')) {
        return propertyKey;
    }

    return propertyKey;
};

const generateNeo4jQueryFromPropertyOfVariable = (
    { variable, property }: IPropertyOfVariable,
    resultVariableNamePrefix: string,
    entityTemplate: IMongoEntityTemplate,
): CypherQuery => {
    const resultValueVariableName = `${resultVariableNamePrefix}${resultValueVariableNameSuffix}`;
    const resultCausesVariableName = `${resultVariableNamePrefix}${resultCausesVariableNameSuffix}`;

    const variableName = getVariableName(variable);
    const aggregatedRelationshipName = variable.aggregatedRelationship && getAggregatedRelationshipName(variable as Required<IVariable>);

    const propertyKey = getPropertyKey(entityTemplate, property);
    const cypherPath = `${variableName}.\`${propertyKey}\``;

    return {
        cypherCalculation: `
            WITH *, ${cypherPath} as ${resultValueVariableName}
            WITH *, {
                instance: {
                    entityId: \`${variable.entityTemplateId}\`._id
                    ${
                        variable.aggregatedRelationship
                            ? `,
                    aggregatedRelationship: {
                        relationshipId: ${aggregatedRelationshipName}._id,
                        otherEntityId: ${variableName}._id
                    }`
                            : ''
                    }
                },
                property: "${propertyKey}",
                value: ${resultValueVariableName}
            } as cause
            WITH *, { cause: cause } as ${resultCausesVariableName} // IPropertyOfVariableCauses
        `,
        resultValueVariableName,
        resultCausesVariableName,
        parameters: {},
    };
};

const generateNeo4jQueryFromArgument = (
    argument: IArgument,
    withVariablesForSubQueries: string[],
    resultVariableNamePrefix: string,
    entityTemplate: IMongoEntityTemplate,
): CypherQuery => {
    if (isConstant(argument)) {
        return generateNeo4jQueryFromConstant(argument, `${resultVariableNamePrefix}constant_`);
    }
    if (isPropertyOfVariable(argument)) {
        return generateNeo4jQueryFromPropertyOfVariable(argument, `${resultVariableNamePrefix}propertyOfVariable_`, entityTemplate);
    }

    if (isCountAggFunction(argument)) {
        return generateNeo4jQueryFromCountAggFunction(argument, withVariablesForSubQueries, `${resultVariableNamePrefix}countAggFunction_`);
    }

    if (isSumAggFunction(argument)) {
        return generateNeo4jQueryFromSumAggFunction(argument, withVariablesForSubQueries, `${resultVariableNamePrefix}sumAggFunction_`);
    }

    if (isRegularFunction(argument)) {
        return generateNeo4jQueryFromRegularFunction(
            argument,
            withVariablesForSubQueries,
            `${resultVariableNamePrefix}regularFunction_`,
            entityTemplate,
        );
    }

    throw new Error('unexpected argument, must be constant/propertyOfVariable/countAggFunction/sumAggFunction/regularSumFunction');
};

const generateNeo4jQueryFromGroup = (
    formula: IGroup,
    withVariablesForSubQueries: string[],
    resultVariableNamePrefix: string,
    entityTemplate: IMongoEntityTemplate,
): CypherQuery => {
    const subFormulasQueries = formula.subFormulas.map((subFormula, index) => {
        // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->group->formulas)
        return generateNeo4jQueryFromFormula(
            subFormula,
            withVariablesForSubQueries,
            `${resultVariableNamePrefix}subFormula${index}_`,
            entityTemplate,
        );
    });

    const resultValueVariableName = `${resultVariableNamePrefix}${resultValueVariableNameSuffix}`;
    const resultCausesVariableName = `${resultVariableNamePrefix}${resultCausesVariableNameSuffix}`;

    return {
        cypherCalculation: `
        ${subFormulasQueries.map(({ cypherCalculation }) => cypherCalculation).join('\n')}
        WITH *,
        ${subFormulasQueries.map((subFormula) => subFormula.resultValueVariableName).join(` ${formula.ruleOfGroup} `)} as ${resultValueVariableName},
        [${subFormulasQueries
            .map((subFormula) => subFormula.resultCausesVariableName)
            .join(', ')}] as ${resultVariableNamePrefix}subFormulasUnfiltered
        WITH *, {
            // if group is false, then all falsy subFormulas caused it. same goes to true
            subFormulas: [subFormula IN ${resultVariableNamePrefix}subFormulasUnfiltered WHERE subFormula.resultValue = ${resultValueVariableName} | subFormula],
            resultValue: ${resultValueVariableName}
        } as ${resultCausesVariableName}
        `,
        resultValueVariableName,
        resultCausesVariableName,
        parameters: subFormulasQueries
            .map(({ parameters }) => parameters)
            .reduce((prevParameters, currParameters) => ({ ...prevParameters, ...currParameters })),
    };
};

const generateEquationQuery = (operatorBool: IOperatorBool, lhsCypherQuery: string, rhsCypherQuery: string) => {
    switch (operatorBool) {
        case 'equals':
            return `(${lhsCypherQuery}) = (${rhsCypherQuery})`;
        case 'notEqual':
            return `(${lhsCypherQuery}) <> (${rhsCypherQuery})`;
        case 'lessThan':
            return `(${lhsCypherQuery}) < (${rhsCypherQuery})`;
        case 'lessThanOrEqual':
            return `(${lhsCypherQuery}) <= (${rhsCypherQuery})`;
        case 'greaterThan':
            return `(${lhsCypherQuery}) > (${rhsCypherQuery})`;
        case 'greaterThanOrEqual':
            return `(${lhsCypherQuery}) >= (${rhsCypherQuery})`;
        // support inRange operator
        // case 'inRange':
        //     return `(${lhsCypherQuery}) != (${rhsCypherQuery})`;
        // support unary operator
        // case 'blank':
        //     return `node.${field} IS NULL`;
        // case 'notBlank':
        //     return `node.${field} IS NOT NULL`;

        default:
            throw new Error(
                `unexpected boolean operator "${operatorBool}" can be only equals/notEqual/lessThan/lessThanOrEqual/greaterThan/greaterThanOrEqual`,
            );
    }
};

const generateNeo4jQueryFromEquation = (
    formula: IEquation,
    withVariablesForSubQueries: string[],
    resultVariableNamePrefix: string,
    entityTemplate: IMongoEntityTemplate,
): CypherQuery => {
    const lhsArgumentQuery = generateNeo4jQueryFromArgument(
        formula.lhsArgument,
        withVariablesForSubQueries,
        `${resultVariableNamePrefix}lhsArgument_`,
        entityTemplate,
    );

    const rhsArgumentQuery = generateNeo4jQueryFromArgument(
        formula.rhsArgument,
        withVariablesForSubQueries,
        `${resultVariableNamePrefix}rhsArgument_`,
        entityTemplate,
    );

    const equationQuery = generateEquationQuery(
        formula.operatorBool,
        lhsArgumentQuery.resultValueVariableName,
        rhsArgumentQuery.resultValueVariableName,
    );

    const resultValueVariableName = `${resultVariableNamePrefix}${resultValueVariableNameSuffix}`;
    const resultCausesVariableName = `${resultVariableNamePrefix}${resultCausesVariableNameSuffix}`;

    return {
        cypherCalculation: `
        ${lhsArgumentQuery.cypherCalculation}
        ${rhsArgumentQuery.cypherCalculation}
        WITH *,
        ${equationQuery} as ${resultValueVariableName}
        WITH *, {
            lhsArgument: ${lhsArgumentQuery.resultCausesVariableName},
            rhsArgument: ${rhsArgumentQuery.resultCausesVariableName},
            resultValue: ${resultValueVariableName}
        } as ${resultCausesVariableName}
        `,
        resultValueVariableName,
        resultCausesVariableName,
        parameters: { ...lhsArgumentQuery.parameters, ...rhsArgumentQuery.parameters },
    };
};

const generateNeo4jQueryFromAggregationGroup = (
    formula: IAggregationGroup,
    withVariablesForSubQueries: string[],
    resultVariableNamePrefix: string,
    entityTemplate: IMongoEntityTemplate,
): CypherQuery => {
    const {
        entityTemplateId,
        aggregatedRelationship: { relationshipTemplateId },
    } = formula.variableOfAggregation;

    const aggregationVariableName = getVariableName(formula.variableOfAggregation);
    const aggregatedRelationshipName = getAggregatedRelationshipName(formula.variableOfAggregation);

    // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->aggGroup->subFormulas)
    const formulaQuery = generateNeo4jQueryFromGroup(
        { isGroup: true, ruleOfGroup: formula.ruleOfGroup, subFormulas: formula.subFormulas },
        [...withVariablesForSubQueries, aggregatedRelationshipName, aggregationVariableName],
        resultVariableNamePrefix,
        entityTemplate,
    );

    const resultValueVariableName = `${resultVariableNamePrefix}${resultValueVariableNameSuffix}`;
    const resultCausesVariableName = `${resultVariableNamePrefix}${resultCausesVariableNameSuffix}`;

    let neoAggregation: string;
    switch (formula.aggregation) {
        case 'EVERY': {
            neoAggregation = 'apoc.agg.minItems'; // "min" because if at least one value is "false" then be false
            break;
        }
        case 'SOME': {
            neoAggregation = 'apoc.agg.maxItems'; // "max" because if some value is "true", then be true
            break;
        }
        default:
            throw new Error(`unexpected aggregation group "${formula.aggregation}" can be only EVERY/SOME`);
    }

    return {
        cypherCalculation: `
            CALL {
                with ${withVariablesForSubQueries.join(', ')}
                match (\`${entityTemplateId}\`)-[${aggregatedRelationshipName}:\`${relationshipTemplateId}\`]-(${aggregationVariableName})

                ${formulaQuery.cypherCalculation}

                with *, {
                    instance: {
                        entityId: \`${entityTemplateId}\`._id,
                        aggregatedRelationship: {
                            relationshipId: ${aggregatedRelationshipName}._id,
                            otherEntityId: ${aggregationVariableName}._id
                        }
                    },
                    subFormulas: ${formulaQuery.resultCausesVariableName}.subFormulas,
                    resultValue: ${formulaQuery.resultValueVariableName}
                } as cause
                return ${neoAggregation}(cause, ${formulaQuery.resultValueVariableName}) as aggResult
            }

            // min/max agg on zero results returns nulls
            with *,
            CASE
                // for "Every" agg ("min") if no results in agg (=null), consider as true
                // for "Some" agg ("max") if no results in agg (=null), consider as false (because at least one should exist)
                WHEN (aggResult.value IS NULL AND "${neoAggregation}" = "apoc.agg.minItems") THEN true
                WHEN (aggResult.value IS NULL AND "${neoAggregation}" = "apoc.agg.maxItems") THEN false
                ELSE aggResult.value
            END as ${resultValueVariableName}
            WITH *, { iterations: aggResult.items, resultValue: ${resultValueVariableName} } as ${resultCausesVariableName}
        `,
        resultValueVariableName,
        resultCausesVariableName,
        parameters: formulaQuery.parameters,
    };
};

const generateNeo4jQueryFromFormula = (
    formula: IFormula,
    withVariablesForSubQueries: string[],
    resultVariableNamePrefix: string,
    entityTemplate: IMongoEntityTemplate,
): CypherQuery => {
    if (isGroup(formula)) {
        return generateNeo4jQueryFromGroup(formula, withVariablesForSubQueries, `${resultVariableNamePrefix}group_`, entityTemplate);
    }

    if (isEquation(formula)) {
        return generateNeo4jQueryFromEquation(formula, withVariablesForSubQueries, `${resultVariableNamePrefix}equation_`, entityTemplate);
    }

    if (isAggregationGroup(formula)) {
        return generateNeo4jQueryFromAggregationGroup(
            formula,
            withVariablesForSubQueries,
            `${resultVariableNamePrefix}aggregationGroup_`,
            entityTemplate,
        );
    }

    throw new Error('unexpected formula, must be group/equation/aggeregationGroup');
};

// eslint-disable-next-line import/prefer-default-export
export const generateNeo4jRuleQueryOnEntity = (rule: IMongoRule, entityId: string, entityTemplate: IMongoEntityTemplate): CypherQuery => {
    const { entityTemplateId, formula } = rule;

    const entityVariableName = `\`${entityTemplateId}\``;
    const variablesForSubQueries = [entityVariableName];

    const formulaQuery = generateNeo4jQueryFromFormula(formula, variablesForSubQueries, 'formula_', entityTemplate);

    return {
        cypherCalculation: `
        MATCH (${entityVariableName})
        WHERE ${entityVariableName}._id = $entityId
        
        ${formulaQuery.cypherCalculation}

        return ${formulaQuery.resultValueVariableName} as value, ${formulaQuery.resultCausesVariableName} as formulaCauses
        `,
        resultValueVariableName: formulaQuery.resultValueVariableName,
        resultCausesVariableName: formulaQuery.resultCausesVariableName,
        parameters: {
            entityId,
            ...formulaQuery.parameters,
            // eslint-disable-next-line no-underscore-dangle
            getTodayFuncValue: rule.doesFormulaHaveTodayFunc ? getNeo4jDate(new Date()) : undefined,
        },
    };
};

export const generateNeo4jRuleQueryOnEntitiesOfTemplate = (
    rule: IMongoRule,
    entityTemplate: IMongoEntityTemplate,
    getTodayFuncValue: Date = new Date(),
    returnOnlyFailedResults: boolean = true,
): CypherQuery => {
    const { entityTemplateId, formula } = rule;

    const entityVariableName = `\`${entityTemplateId}\``;
    const variablesForSubQueries = [entityVariableName];

    const formulaQuery = generateNeo4jQueryFromFormula(formula, variablesForSubQueries, 'formula_', entityTemplate);

    return {
        cypherCalculation: `
        MATCH (${entityVariableName}: \`${entityTemplateId}\`)
        
        ${formulaQuery.cypherCalculation}

        ${returnOnlyFailedResults ? `WHERE ${formulaQuery.resultValueVariableName} = false` : ''}

        return ${entityVariableName}._id as entityId, ${formulaQuery.resultValueVariableName} as value, ${formulaQuery.resultCausesVariableName} as formulaCauses
        `,
        resultValueVariableName: formulaQuery.resultValueVariableName,
        resultCausesVariableName: formulaQuery.resultCausesVariableName,
        parameters: {
            ...formulaQuery.parameters,
            getTodayFuncValue: getNeo4jDate(new Date(getTodayFuncValue)),
        },
    };
};
