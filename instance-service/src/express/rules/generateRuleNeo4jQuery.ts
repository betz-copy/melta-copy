import { v4 as uuidv4 } from 'uuid';
import {
    IAggregationGroup,
    ICountAggFunction,
    ISumAggFunction,
    IEquation,
    IGroup,
    isAggregationGroup,
    isCountAggFunction,
    isEquation,
    isGroup,
    isRegularFunction,
    isSumAggFunction,
    IOperatorBool,
    CypherQuery,
    IRelevantTemplates,
    IRegularFunction,
    IMongoRule,
} from './interfaces';
import { IArgument, IConstant, isConstant, isPropertyOfVariable } from './interfaces/argument';
import { IFormula } from './interfaces/formula';

const generateNeo4jQueryFromCountAggFunction = (
    countAggFunction: ICountAggFunction,
    { unpinnedEntityTemplateId, connectionsTemplates }: IRelevantTemplates,
): CypherQuery => {
    const [pinnedEntityTemplateId, aggregatedRelationshipTemplateId] = countAggFunction.variableName.split('.');
    const aggregatedConnection = connectionsTemplates.find(({ relationshipTemplate: { _id } }) => _id === aggregatedRelationshipTemplateId);

    if (!aggregatedConnection) {
        throw new Error(
            `unexpected count aggregation variable name "${countAggFunction.variableName}", relationship with id "${aggregatedRelationshipTemplateId}" doesnt exist for the pinned entity template`,
        );
    }

    const { relationshipTemplate: aggregatedRelationship } = aggregatedConnection;

    const aggResultVariableName = `${countAggFunction.variableName}_countAggResult_${uuidv4().slice(0, 8)}`;
    return {
        cypherQuery: `\`${aggResultVariableName}\``,
        aggergationSubQueries: [
            {
                subQuery: `
                    CALL apoc.cypher.run("
                        with $pinnedEntityTemplateId as \`${pinnedEntityTemplateId}\`, $unpinnedEntityTemplateId as \`${unpinnedEntityTemplateId}\`

                        match (\`${pinnedEntityTemplateId}\`)-[ri:\`${aggregatedRelationship._id}\`]-(\`${countAggFunction.variableName}\`)
                        return count(\`${countAggFunction.variableName}\`) as aggResult
                    ", {
                        pinnedEntityTemplateId: \`${pinnedEntityTemplateId}\`,
                        unpinnedEntityTemplateId: \`${unpinnedEntityTemplateId}\`
                    }) yield value as \`${aggResultVariableName}_value\`
                    with *, \`${aggResultVariableName}_value\`.aggResult as \`${aggResultVariableName}\`
                `,
                resultVariableName: `\`${aggResultVariableName}\``,
            },
        ],
        parameters: {},
    };
};

const generateNeo4jQueryFromSumAggFunction = (
    sumAggFunction: ISumAggFunction,
    { unpinnedEntityTemplateId, connectionsTemplates }: IRelevantTemplates,
): CypherQuery => {
    const [pinnedEntityTemplateId, aggregatedRelationshipTemplateId] = sumAggFunction.variableName.split('.');
    const aggregatedConnection = connectionsTemplates.find(({ relationshipTemplate: { _id } }) => _id === aggregatedRelationshipTemplateId);

    if (!aggregatedConnection) {
        throw new Error(
            `unexpected sum aggregation variable name "${sumAggFunction.variableName}", relationship with id "${aggregatedRelationshipTemplateId}" doesnt exist for the pinned entity template`,
        );
    }

    const { relationshipTemplate: aggregatedRelationship } = aggregatedConnection;

    const aggResultVariableName = `${sumAggFunction.variableName}_sumAggResult_${uuidv4().slice(0, 8)}`;
    return {
        cypherQuery: `\`${aggResultVariableName}\``,
        aggergationSubQueries: [
            {
                subQuery: `
                    CALL apoc.cypher.run("
                        with $pinnedEntityTemplateId as \`${pinnedEntityTemplateId}\`, $unpinnedEntityTemplateId as \`${unpinnedEntityTemplateId}\`
                        
                        match (\`${pinnedEntityTemplateId}\`)-[ri:\`${aggregatedRelationship._id}\`]-(\`${sumAggFunction.variableName}\`)
                        return sum(\`${sumAggFunction.variableName}\`.${sumAggFunction.property}) as aggResult
                    ", {
                        pinnedEntityTemplateId: \`${pinnedEntityTemplateId}\`,
                        unpinnedEntityTemplateId: \`${unpinnedEntityTemplateId}\`,
                    }) yield value as \`${aggResultVariableName}_value\`
                    with *, \`${aggResultVariableName}_value\`.aggResult as \`${aggResultVariableName}\`
                `,
                resultVariableName: `\`${aggResultVariableName}\``,
            },
        ],
        parameters: {},
    };
};

const generateNeo4jQueryFromRegularFunction = (func: IRegularFunction, relevantTemplates: IRelevantTemplates): CypherQuery => {
    // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->group->formulas)
    const funcArguments = func.arguments.map((argument) => generateNeo4jQueryFromArgument(argument, relevantTemplates));
    if (func.functionType === 'toDate') {
        const [dateTimeArgumentQuery] = funcArguments;
        return {
            cypherQuery: `date(${dateTimeArgumentQuery.cypherQuery})`,
            aggergationSubQueries: dateTimeArgumentQuery.aggergationSubQueries,
            parameters: dateTimeArgumentQuery.parameters,
        };
    }
    if (func.functionType === 'addToDate' || func.functionType === 'addToDateTime') {
        const [date, duration] = funcArguments;
        return {
            cypherQuery: `${date.cypherQuery} + ${duration.cypherQuery}`,
            aggergationSubQueries: [...date.aggergationSubQueries, ...duration.aggergationSubQueries],
            parameters: { ...date.parameters, ...duration.parameters },
        };
    }
    if (func.functionType === 'subFromDate' || func.functionType === 'subFromDateTime') {
        const [date, duration] = funcArguments;
        return {
            cypherQuery: `${date.cypherQuery} - ${duration.cypherQuery}`,
            aggergationSubQueries: [...date.aggergationSubQueries, ...duration.aggergationSubQueries],
            parameters: { ...date.parameters, ...duration.parameters },
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

const generateNeo4jQueryFromConstant = (constant: IConstant): CypherQuery => {
    let valueCypherQuery: string;

    if (constant.type === 'string' || constant.type === 'date' || constant.type === 'dateTime') {
        valueCypherQuery = `'${constant.value as string}'`; // todo: if constant.value contains quotes, we're doomed
    } else if (constant.type === 'number') {
        valueCypherQuery = constant.value.toString();
    } else if (constant.type === 'boolean') {
        valueCypherQuery = constant.value.toString();
    } else if (constant.type === 'dateDuration' || constant.type === 'dateTimeDuration') {
        const durationComponents = getDurationComponents(constant.value as string);
        const { Y = 0, M = 0, D = 0, H = 0 } = durationComponents;

        valueCypherQuery = `duration('P${Y}Y${M}M${D}DT${H}H')`;
    } else {
        throw new Error('unexpected constant type string/number/boolean');
    }
    return {
        cypherQuery: valueCypherQuery,
        aggergationSubQueries: [],
        parameters: {},
    };
};

const generateNeo4jQueryFromArgument = (argument: IArgument, relevantTemplates: IRelevantTemplates): CypherQuery => {
    if (isConstant(argument)) {
        return generateNeo4jQueryFromConstant(argument);
    }
    if (isPropertyOfVariable(argument)) {
        return {
            // todo: can assume property is good format?
            cypherQuery: `\`${argument.variableName}\`.${argument.property}`,
            aggergationSubQueries: [],
            parameters: {},
        };
    }

    if (isCountAggFunction(argument)) {
        return generateNeo4jQueryFromCountAggFunction(argument, relevantTemplates);
    }

    if (isSumAggFunction(argument)) {
        return generateNeo4jQueryFromSumAggFunction(argument, relevantTemplates);
    }

    if (isRegularFunction(argument)) {
        return generateNeo4jQueryFromRegularFunction(argument, relevantTemplates);
    }

    throw new Error('unexpected argument, must be constant/propertyOfVariable/countAggFunction/sumAggFunction/regularSumFunction');
};

const generateNeo4jQueryFromGroup = (formula: IGroup, relevantTemplates: IRelevantTemplates): CypherQuery => {
    // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->group->formulas)
    const subFormulasQueries = formula.subFormulas.map((subFormula) => generateNeo4jQueryFromFormula(subFormula, relevantTemplates));
    return {
        cypherQuery: subFormulasQueries.map(({ cypherQuery }) => `(${cypherQuery})`).join(` ${formula.ruleOfGroup} `),
        aggergationSubQueries: subFormulasQueries.flatMap(({ aggergationSubQueries }) => aggergationSubQueries),
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

const generateNeo4jQueryFromEquation = (formula: IEquation, relevantTemplates: IRelevantTemplates): CypherQuery => {
    const lhsArgumentQuery = generateNeo4jQueryFromArgument(formula.lhsArgument, relevantTemplates);
    const rhsArgumentQuery = generateNeo4jQueryFromArgument(formula.rhsArgument, relevantTemplates);

    const equationQuery = generateEquationQuery(formula.operatorBool, lhsArgumentQuery.cypherQuery, rhsArgumentQuery.cypherQuery);

    return {
        cypherQuery: equationQuery,
        aggergationSubQueries: [...lhsArgumentQuery.aggergationSubQueries, ...rhsArgumentQuery.aggergationSubQueries],
        parameters: { ...lhsArgumentQuery.parameters, ...rhsArgumentQuery.parameters },
    };
};

const generateNeo4jQueryFromAggregationGroup = (formula: IAggregationGroup, relevantTemplates: IRelevantTemplates): CypherQuery => {
    const [pinnedEntityTemplateId, aggregatedRelationshipTemplateId] = formula.variableNameOfAggregation.split('.');
    const aggregatedConnection = relevantTemplates.connectionsTemplates.find(
        ({ relationshipTemplate: { _id } }) => _id === aggregatedRelationshipTemplateId,
    );

    if (!aggregatedConnection) {
        throw new Error(
            `unexpected aggregation variable name "${formula.variableNameOfAggregation}", relationship with id "${aggregatedRelationshipTemplateId}" doesnt exist for the pinned entity template`,
        );
    }

    const { relationshipTemplate: aggregatedRelationship } = aggregatedConnection;

    const aggResultVariableName = `${formula.variableNameOfAggregation}_boolAggResult_${uuidv4().slice(0, 8)}`;
    // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->aggGroup->subFormulas)
    const formulaQuery = generateNeo4jQueryFromFormula(
        { isGroup: true, ruleOfGroup: formula.ruleOfGroup, subFormulas: formula.subFormulas },
        relevantTemplates,
    );

    let neoAggregation: string;
    switch (formula.aggregation) {
        case 'EVERY': {
            neoAggregation = 'min'; // "min" because if at least one value is "false" then be false
            break;
        }
        case 'SOME': {
            neoAggregation = 'max'; // "max" because if some value is "true", then be true
            break;
        }
        default:
            throw new Error(`unexpected aggregation group "${formula.aggregation}" can be only EVERY/SOME`);
    }

    return {
        cypherQuery: `\`${aggResultVariableName}\``,
        aggergationSubQueries: [
            {
                subQuery: `
                    CALL apoc.cypher.run("
                        with $pinnedEntityTemplateId as \`${pinnedEntityTemplateId}\`, $unpinnedEntityTemplateId as \`${relevantTemplates.unpinnedEntityTemplateId}\`
                        
                        match (\`${pinnedEntityTemplateId}\`)-[ri:\`${aggregatedRelationship._id}\`]-(\`${formula.variableNameOfAggregation}\`)
                        return ${neoAggregation}(${formulaQuery.cypherQuery}) as aggResult
                    ", {
                        pinnedEntityTemplateId: \`${pinnedEntityTemplateId}\`,
                        unpinnedEntityTemplateId: \`${relevantTemplates.unpinnedEntityTemplateId}\`
                    }) yield value as \`${aggResultVariableName}_value\`
                    with *, \`${aggResultVariableName}_value\`.aggResult as \`${aggResultVariableName}_orNull\`
                    // min/max agg on zero results returns nulls
                    with *,
                    CASE
                        // for "Every" agg ("min") if no results in agg (=null), consider as true
                        // for "Some" agg ("max") if no results in agg (=null), consider as false (because at least one should exist)
                        WHEN (\`${aggResultVariableName}_orNull\` IS NULL AND "${neoAggregation}" = "min") THEN true
                        WHEN (\`${aggResultVariableName}_orNull\` IS NULL AND "${neoAggregation}" = "max") THEN false
                        ELSE \`${aggResultVariableName}_orNull\`
                    END as \`${aggResultVariableName}\`
                `,
                resultVariableName: `\`${aggResultVariableName}\``,
            },
        ],
        parameters: formulaQuery.parameters,
    };
};

const generateNeo4jQueryFromFormula = (formula: IFormula, relevantTemplates: IRelevantTemplates): CypherQuery => {
    if (isGroup(formula)) {
        return generateNeo4jQueryFromGroup(formula, relevantTemplates);
    }

    if (isEquation(formula)) {
        return generateNeo4jQueryFromEquation(formula, relevantTemplates);
    }

    if (isAggregationGroup(formula)) {
        return generateNeo4jQueryFromAggregationGroup(formula, relevantTemplates);
    }

    throw new Error('unexpected formula, must be group/equation/aggeregationGroup');
};

export const generateNeo4jRuleQueryAgainstPair = (
    rule: IMongoRule,
    pinnedEntityId: string,
    nonPinnedEntityId: string,
    nonPinnedRelationshipId: string,
    relevantTemplates: IRelevantTemplates,
): Omit<CypherQuery, 'aggergationSubQueries'> => {
    const formulaQuery = generateNeo4jQueryFromFormula(rule.formula, relevantTemplates);

    const { pinnedEntityTemplateId, unpinnedEntityTemplateId } = relevantTemplates;

    return {
        cypherQuery: `
        MATCH (\`${pinnedEntityTemplateId}\`)-[rel]-(\`${unpinnedEntityTemplateId}\`)
        WHERE \`${pinnedEntityTemplateId}\`._id = $pinnedEntityId AND \`${unpinnedEntityTemplateId}\`._id = $nonPinnedEntityId AND rel._id = $nonPinnedRelationshipId
        
        // aggregations actions
        ${formulaQuery.aggergationSubQueries.map(({ subQuery }) => subQuery).join('\n')}

        CALL apoc.cypher.run("
            with $pinnedEntityTemplateId as \`${pinnedEntityTemplateId}\`, $unpinnedEntityTemplateId as \`${unpinnedEntityTemplateId}\`
            ${formulaQuery.aggergationSubQueries.length > 0 ? ',' : ''}
            ${formulaQuery.aggergationSubQueries.map(({ resultVariableName }) => `$${resultVariableName} as ${resultVariableName}`).join(', ')}

            return (${formulaQuery.cypherQuery}) as doesRuleStillApply
        ", {
            pinnedEntityTemplateId: \`${pinnedEntityTemplateId}\`,
            unpinnedEntityTemplateId: \`${unpinnedEntityTemplateId}\`

            ${formulaQuery.aggergationSubQueries.length > 0 ? ',' : ''}
            ${formulaQuery.aggergationSubQueries.map(({ resultVariableName }) => `${resultVariableName}: ${resultVariableName}`).join(', ')}
        }) yield value as doesRuleStillApply_value

        return doesRuleStillApply_value.doesRuleStillApply as doesRuleStillApply;                           
        `,
        parameters: { pinnedEntityId, nonPinnedEntityId, nonPinnedRelationshipId, ...formulaQuery.parameters },
    };
};

export const generateNeo4jRuleQueryAgainstPinnedEntity = (
    rule: IMongoRule,
    pinnedEntityId: string,
    relevantTemplates: IRelevantTemplates,
): Omit<CypherQuery, 'aggergationSubQueries'> => {
    const formulaQuery = generateNeo4jQueryFromFormula(rule.formula, relevantTemplates);

    const { pinnedEntityTemplateId, unpinnedEntityTemplateId } = relevantTemplates;

    return {
        cypherQuery: `
        MATCH (\`${pinnedEntityTemplateId}\`)-[rel: \`${rule.relationshipTemplateId}\`]-(\`${unpinnedEntityTemplateId}\`)
        WHERE \`${pinnedEntityTemplateId}\`._id = $pinnedEntityId
        
        // aggregations actions
        ${formulaQuery.aggergationSubQueries.map(({ subQuery }) => subQuery).join('\n')}

        CALL apoc.cypher.run("
            with $pinnedEntityTemplateId as \`${pinnedEntityTemplateId}\`, $unpinnedEntityTemplateId as \`${unpinnedEntityTemplateId}\`
            ${formulaQuery.aggergationSubQueries.length > 0 ? ',' : ''}
            ${formulaQuery.aggergationSubQueries.map(({ resultVariableName }) => `$${resultVariableName} as ${resultVariableName}`).join(', ')}

            return (${formulaQuery.cypherQuery}) as doesRuleStillApply
        ", {
            pinnedEntityTemplateId: \`${pinnedEntityTemplateId}\`,
            unpinnedEntityTemplateId: \`${unpinnedEntityTemplateId}\`

            ${formulaQuery.aggergationSubQueries.length > 0 ? ',' : ''}
            ${formulaQuery.aggergationSubQueries.map(({ resultVariableName }) => `${resultVariableName}: ${resultVariableName}`).join(', ')}
        }) yield value as doesRuleStillApply_value

        WITH rel._id as unpinnedRelationshipId, \`${unpinnedEntityTemplateId}\`._id as unpinnedEntityId, doesRuleStillApply_value.doesRuleStillApply as doesRuleStillApply
        return unpinnedRelationshipId, unpinnedEntityId, doesRuleStillApply;                           
        `,
        parameters: { pinnedEntityId, ...formulaQuery.parameters },
    };
};
