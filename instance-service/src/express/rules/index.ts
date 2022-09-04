import { v4 as uuidv4 } from 'uuid';
import { IMongoEntityTemplate } from '../entities/interface';
import { IMongoRelationshipTemplate } from '../relationships/interface';
import {
    IAggregationGroup,
    ICountAggFunction,
    ISumAggFunction,
    IEquation,
    IGroup,
    IRelationshipTemplateRule,
    isAggregationGroup,
    isCountAggFunction,
    isEquation,
    isGroup,
    isRegularSumFunction,
    isSumAggFunction,
    IOperatorBool,
} from './interfaces';
import { IArgument, isConstant, isPropertyOfVariable } from './interfaces/argument';
import { IFormula } from './interfaces/formula';

type CypherQuery = {
    cypherQuery: string;
    aggergationSubQueries: Array<{ subQuery: string; resultVariableName: string }>;
    parameters: Record<string, any>; // todo: use parameters to insert data for security
};

const generateNeo4jQueryFromCountAggFunction = (
    countAggFunction: ICountAggFunction,
    connectionsTemplates: Array<{ relationshipTemplate: IMongoRelationshipTemplate; unpinnedEntityTemplate: IMongoEntityTemplate }>,
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
                    call {
                        with \`${pinnedEntityTemplateId}\`
                        match (\`${pinnedEntityTemplateId}\`)-[ri:\`${aggregatedRelationship._id}\`]-(\`${countAggFunction.variableName}\`)
                        return count(\`${countAggFunction.variableName}\`) as \`${aggResultVariableName}\`
                    }
                `,
                resultVariableName: `\`${aggResultVariableName}\``,
            },
        ],
        parameters: {},
    };
};

const generateNeo4jQueryFromSumAggFunction = (
    sumAggFunction: ISumAggFunction,
    connectionsTemplates: Array<{ relationshipTemplate: IMongoRelationshipTemplate; unpinnedEntityTemplate: IMongoEntityTemplate }>,
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
                    call {
                        with \`${pinnedEntityTemplateId}\`
                        match (\`${pinnedEntityTemplateId}\`)-[ri:\`${aggregatedRelationship._id}\`]-(\`${sumAggFunction.variableName}\`)
                        return sum(\`${sumAggFunction.variableName}\`.${sumAggFunction.property}) as \`${aggResultVariableName}\`
                    }
                `,
                resultVariableName: `\`${aggResultVariableName}\``,
            },
        ],
        parameters: {},
    };
};

const generateNeo4jQueryFromArgument = (
    argument: IArgument,
    connectionsTemplates: Array<{ relationshipTemplate: IMongoRelationshipTemplate; unpinnedEntityTemplate: IMongoEntityTemplate }>,
): CypherQuery => {
    if (isConstant(argument)) {
        return {
            cypherQuery: `${argument.value}`,
            aggergationSubQueries: [],
            parameters: {},
        };
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
        return generateNeo4jQueryFromCountAggFunction(argument, connectionsTemplates);
    }

    if (isSumAggFunction(argument)) {
        return generateNeo4jQueryFromSumAggFunction(argument, connectionsTemplates);
    }

    if (isRegularSumFunction(argument)) {
        const lhsArgumentQuery = generateNeo4jQueryFromArgument(argument.lhsArgument, connectionsTemplates);
        const rhsArgumentQuery = generateNeo4jQueryFromArgument(argument.rhsArgument, connectionsTemplates);
        return {
            cypherQuery: `(${lhsArgumentQuery.cypherQuery}) + (${rhsArgumentQuery.cypherQuery})`,
            aggergationSubQueries: [...lhsArgumentQuery.aggergationSubQueries, ...rhsArgumentQuery.aggergationSubQueries],
            parameters: { ...lhsArgumentQuery.parameters, ...rhsArgumentQuery.parameters },
        };
    }

    throw new Error('unexpected argument, must be constant/propertyOfVariable/countAggFunction/sumAggFunction/regularSumFunction');
};

const generateNeo4jQueryFromGroup = (
    formula: IGroup,
    connectionsTemplates: Array<{ relationshipTemplate: IMongoRelationshipTemplate; unpinnedEntityTemplate: IMongoEntityTemplate }>,
): CypherQuery => {
    // eslint-disable-next-line no-use-before-define -- circular recursive functions (formula->group->formulas)
    const subFormulasQueries = formula.subFormulas.map((subFormula) => generateNeo4jQueryFromFormula(subFormula, connectionsTemplates));
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

const generateNeo4jQueryFromEquation = (
    formula: IEquation,
    connectionsTemplates: Array<{ relationshipTemplate: IMongoRelationshipTemplate; unpinnedEntityTemplate: IMongoEntityTemplate }>,
): CypherQuery => {
    const lhsArgumentQuery = generateNeo4jQueryFromArgument(formula.lhsArgument, connectionsTemplates);
    const rhsArgumentQuery = generateNeo4jQueryFromArgument(formula.rhsArgument, connectionsTemplates);

    const equationQuery = generateEquationQuery(formula.operatorBool, lhsArgumentQuery.cypherQuery, rhsArgumentQuery.cypherQuery);

    return {
        cypherQuery: equationQuery,
        aggergationSubQueries: [...lhsArgumentQuery.aggergationSubQueries, ...rhsArgumentQuery.aggergationSubQueries],
        parameters: { ...lhsArgumentQuery.parameters, ...rhsArgumentQuery.parameters },
    };
};

const generateNeo4jQueryFromAggregationGroup = (
    formula: IAggregationGroup,
    connectionsTemplates: Array<{ relationshipTemplate: IMongoRelationshipTemplate; unpinnedEntityTemplate: IMongoEntityTemplate }>,
): CypherQuery => {
    const [pinnedEntityTemplateId, aggregatedRelationshipTemplateId] = formula.variableNameOfAggregation.split('.');
    const aggregatedConnection = connectionsTemplates.find(({ relationshipTemplate: { _id } }) => _id === aggregatedRelationshipTemplateId);

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
        connectionsTemplates,
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
                    call {
                        with \`${pinnedEntityTemplateId}\`
                        match (\`${pinnedEntityTemplateId}\`)-[ri:\`${aggregatedRelationship._id}\`]-(\`${formula.variableNameOfAggregation}\`)
                        return ${neoAggregation}(${formulaQuery.cypherQuery}) as \`${aggResultVariableName}\`
                    }
                `,
                resultVariableName: `\`${aggResultVariableName}\``,
            },
        ],
        parameters: formulaQuery.parameters,
    };
};

const generateNeo4jQueryFromFormula = (
    formula: IFormula,
    connectionsTemplates: Array<{ relationshipTemplate: IMongoRelationshipTemplate; unpinnedEntityTemplate: IMongoEntityTemplate }>,
): CypherQuery => {
    if (isGroup(formula)) {
        return generateNeo4jQueryFromGroup(formula, connectionsTemplates);
    }

    if (isEquation(formula)) {
        return generateNeo4jQueryFromEquation(formula, connectionsTemplates);
    }

    if (isAggregationGroup(formula)) {
        return generateNeo4jQueryFromAggregationGroup(formula, connectionsTemplates);
    }

    throw new Error('unexpected formula, must be group/equation/aggeregationGroup');
};

export const generateNeo4jQuery = (
    relationshipTemplateRule: IRelationshipTemplateRule,
    pinnedEntityId: string,
    nonPinnedEntityId: string,
    nonPinnedRelationshipId: string,
    pinnedEntityTemplateId: string,
    nonPinnedEntityTemplateId: string,
    connectionsTemplates: Array<{ relationshipTemplate: IMongoRelationshipTemplate; unpinnedEntityTemplate: IMongoEntityTemplate }>,
): Omit<CypherQuery, 'aggergationSubQueries'> => {
    const formulaQuery = generateNeo4jQueryFromFormula(relationshipTemplateRule.formula, connectionsTemplates);

    return {
        cypherQuery: `
        MATCH (\`${pinnedEntityTemplateId}\`)-[rel]-(\`${nonPinnedEntityTemplateId}\`)
        WHERE \`${pinnedEntityTemplateId}\`._id = $pinnedEntityId AND \`${nonPinnedEntityTemplateId}\`._id = $nonPinnedEntityId AND rel._id = $nonPinnedRelationshipId
        
        // aggregations actions
        ${formulaQuery.aggergationSubQueries.map(({ subQuery }) => subQuery).join('\n')}

        call {
            with \`${pinnedEntityTemplateId}\`, \`${nonPinnedEntityTemplateId}\`,
            ${formulaQuery.aggergationSubQueries.map(({ resultVariableName }) => resultVariableName).join(', ')}

            return (${formulaQuery.cypherQuery}) as doesRuleStillApply
        }
        return doesRuleStillApply;                           
        `,
        parameters: { pinnedEntityId, nonPinnedEntityId, nonPinnedRelationshipId, ...formulaQuery.parameters },
    };
};
