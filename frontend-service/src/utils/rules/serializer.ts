import { JsonGroup, JsonItem, JsonRule, JsonRuleGroupExt } from 'react-awesome-query-builder';
import { v4 as uuid } from 'uuid';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import {
    IAggregationGroup,
    ICountAggFunction,
    IEquation,
    IGroup,
    IOperatorBool,
    isAggregationGroup,
    isCountAggFunction,
    isEquation,
    isGroup,
    isRegularFunction,
} from '../../interfaces/rules';
import { IArgument, IConstant, IPropertyOfVariable, isConstant, isPropertyOfVariable } from '../../interfaces/rules/argument';
import { IFormula } from '../../interfaces/rules/formula';

export class RuleSerializer {
    private static entityTemplates: IMongoEntityTemplatePopulated[] = [];

    private static propertyOfVariableSerializer = (argument: IPropertyOfVariable) => {
        const { variableName, property } = argument;

        return `${variableName.replaceAll('.', '-')}-${property}`;
    };

    private static operatorSerializer = (operator: IOperatorBool) => {
        if (operator === 'equals') return 'equal';
        if (operator === 'notEqual') return 'not_equal';
        if (operator === 'lessThan') return 'less';
        if (operator === 'lessThanOrEqual') return 'less_or_equal';
        if (operator === 'greaterThan') return 'greater';
        if (operator === 'greaterThanOrEqual') return 'greater_or_equal';

        throw new Error('operator not supported');
    };

    private static countSerialzier = (eq: IEquation & { lhsArgument: ICountAggFunction; rhsArgument: IConstant }): JsonRuleGroupExt => {
        return {
            type: 'rule_group',
            properties: {
                field: eq.lhsArgument.variableName.replaceAll('.', '-'),
                valueType: ['number'],
                value: [eq.rhsArgument.value],
                valueSrc: ['value'],
                operator: RuleSerializer.operatorSerializer(eq.operatorBool),
                mode: 'array',
                conjunction: 'AND',
                not: false,
            },
            children1: {},
        };
    };

    private static getEquationValueType = (argument: IPropertyOfVariable) => {
        const { variableName, property: propertyName } = argument;

        if (propertyName === '_id') return 'text';

        const entityTemplateId = variableName.substring(variableName.lastIndexOf('.') + 1);
        const template = RuleSerializer.entityTemplates.find(({ _id }) => _id === entityTemplateId)!;
        const property = template.properties.properties[propertyName];

        if (property.type !== 'string') return property.type;
        if (property.format === 'date') return 'date';
        if (property.format === 'date-time') return 'datetime';

        return 'text';
    };

    private static rhsArgumentSerializer = (rhsArgument: IArgument, connectionInitials: string) => {
        if (isPropertyOfVariable(rhsArgument)) {
            return {
                value: [connectionInitials + RuleSerializer.propertyOfVariableSerializer(rhsArgument)],
                valueSrc: ['field'],
            };
        }

        if (isRegularFunction(rhsArgument)) {
            return {
                value: [
                    `${connectionInitials + RuleSerializer.propertyOfVariableSerializer(rhsArgument.arguments[0] as IPropertyOfVariable)}-ignoreHour`,
                ],
                valueSrc: ['field'],
            };
        }

        if (isConstant(rhsArgument)) {
            return {
                value: [rhsArgument.value],
                valueSrc: ['value'],
            };
        }

        throw new Error('rhs format not supported');
    };

    private static equationSerializer = (eq: IEquation): JsonRule | JsonRuleGroupExt => {
        if (isCountAggFunction(eq.lhsArgument)) {
            return RuleSerializer.countSerialzier(eq as IEquation & { lhsArgument: ICountAggFunction; rhsArgument: IConstant });
        }

        let connectionInitials = '';
        let ruleProperties: any = {};

        if (isRegularFunction(eq.lhsArgument)) {
            const argument = eq.lhsArgument.arguments[0] as IPropertyOfVariable;
            connectionInitials = argument.variableName.includes('.') ? `${argument.variableName.replaceAll('.', '-')}.` : '';

            ruleProperties = {
                field: `${connectionInitials + RuleSerializer.propertyOfVariableSerializer(argument)}-ignoreHour`,
                valueType: ['date'],
                operator: RuleSerializer.operatorSerializer(eq.operatorBool),
            };
        }

        if (isPropertyOfVariable(eq.lhsArgument)) {
            connectionInitials = eq.lhsArgument.variableName.includes('.') ? `${eq.lhsArgument.variableName.replaceAll('.', '-')}.` : '';

            ruleProperties = {
                field: connectionInitials + RuleSerializer.propertyOfVariableSerializer(eq.lhsArgument),
                valueType: [RuleSerializer.getEquationValueType(eq.lhsArgument)],
                operator: RuleSerializer.operatorSerializer(eq.operatorBool),
            };
        }

        return {
            type: 'rule',
            properties: {
                ...ruleProperties,
                ...RuleSerializer.rhsArgumentSerializer(eq.rhsArgument, connectionInitials),
            },
        };
    };

    private static groupSerializer = (gr: IGroup): JsonGroup => {
        return {
            id: uuid(),
            type: 'group',
            properties: {
                conjunction: gr.ruleOfGroup,
            },
            children1: Object.fromEntries(
                gr.subFormulas.map((subFormula) => [uuid(), RuleSerializer.formulaComponentToRuleItem(subFormula) as JsonItem]),
            ),
        };
    };

    private static aggregationSerializer = (operator: IAggregationGroup['aggregation']) => {
        return operator === 'EVERY' ? 'all' : 'some';
    };

    private static aggrregationGroupSerializer = (gr: IAggregationGroup): JsonRuleGroupExt => {
        return {
            type: 'rule_group',
            properties: {
                operator: RuleSerializer.aggregationSerializer(gr.aggregation),
                mode: 'array',
                valueType: [],
                value: [],
                valueSrc: [],
                not: false,
                conjunction: gr.ruleOfGroup,
                field: gr.variableNameOfAggregation.replaceAll('.', '-'),
            },
            children1: Object.fromEntries(
                gr.subFormulas.map((subFormula) => [uuid(), RuleSerializer.formulaComponentToRuleItem(subFormula) as JsonRule]),
            ),
        };
    };

    static formulaToJsonTreeWrapper = (formula: IFormula, entityTemplates: IMongoEntityTemplatePopulated[]): JsonItem => {
        RuleSerializer.entityTemplates = entityTemplates;

        return RuleSerializer.formulaComponentToRuleItem(formula);
    };

    private static formulaComponentToRuleItem = (formula: IFormula): JsonItem => {
        if (isEquation(formula)) {
            return RuleSerializer.equationSerializer(formula);
        }

        if (isGroup(formula)) {
            return RuleSerializer.groupSerializer(formula);
        }

        if (isAggregationGroup(formula)) {
            return RuleSerializer.aggrregationGroupSerializer(formula);
        }

        throw new Error('formula type not supported');
    };
}
