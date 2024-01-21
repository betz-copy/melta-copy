import { JsonGroup, JsonItem, JsonRule, JsonRuleGroupExt, RuleProperties } from 'react-awesome-query-builder';
import { v4 as uuid } from 'uuid';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import {
    IAggregationGroup,
    ICountAggFunction,
    IEquation,
    IGroup,
    IOperatorBool,
    IRegularFunction,
    isAggregationGroup,
    isCountAggFunction,
    isEquation,
    isGroup,
    isRegularFunction,
} from '../../interfaces/rules';
import { IArgument, IConstant, IPropertyOfVariable, isConstant, isPropertyOfVariable } from '../../interfaces/rules/argument';
import { IFormula } from '../../interfaces/rules/formula';
import { FunctionObject, ValueType } from './interfaces';

export class RuleSerializer {
    private static entityTemplates: IEntityTemplateMap = new Map();

    private static propertyOfVariableSerializer = (argument: IPropertyOfVariable, aggregationVariableInitials: string) => {
        const { variableName, property } = argument;

        return `${aggregationVariableInitials}${variableName.replaceAll('.', '-')}-${property}`;
    };

    private static operatorSerializer = (operator: IOperatorBool) => {
        switch (operator) {
            case 'equals':
                return 'equal';
            case 'notEqual':
                return 'not_equal';
            case 'lessThan':
                return 'less';
            case 'lessThanOrEqual':
                return 'less_or_equal';
            case 'greaterThan':
                return 'greater';
            case 'greaterThanOrEqual':
                return 'greater_or_equal';
            default:
                throw new Error('operator not supported');
        }
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

    private static getEquationValueType = (argument: IPropertyOfVariable): ValueType => {
        const { variableName, property: propertyName } = argument;

        if (propertyName === '_id') return 'text';
        if (propertyName === 'disabled') return 'boolean';
        if (propertyName === 'updatedAt' || propertyName === 'createdAt') return 'datetime';

        const entityTemplateId = variableName.substring(variableName.lastIndexOf('.') + 1);
        const template = RuleSerializer.entityTemplates.get(entityTemplateId)!;
        const property = template.properties.properties[propertyName];

        if (property.type === 'array') throw new Error('array not supported in formulas! sorry!'); // todo: block in UI too, or support it
        if (property.type !== 'string') return property.type;
        if (property.format === 'date') return 'date';
        if (property.format === 'date-time') return 'datetime';

        return 'text';
    };

    private static rhsArgumentSerializer = (
        rhsArgument: IArgument,
        aggregationVariableInitials: string,
    ): { value: RuleProperties['value']; valueSrc: NonNullable<RuleProperties['valueSrc']> } => {
        if (isPropertyOfVariable(rhsArgument)) {
            return {
                value: [RuleSerializer.propertyOfVariableSerializer(rhsArgument, aggregationVariableInitials)],
                valueSrc: ['field'],
            };
        }

        if (isRegularFunction(rhsArgument)) {
            if (rhsArgument.functionType === 'toDate') {
                return {
                    value: [
                        `${RuleSerializer.propertyOfVariableSerializer(
                            rhsArgument.arguments[0] as IPropertyOfVariable,
                            aggregationVariableInitials,
                        )}-ignoreHour`,
                    ],
                    valueSrc: ['field'],
                };
            }

            const functionTypesAddOrSub: Array<IRegularFunction['functionType']> = ['addToDate', 'addToDateTime', 'subFromDate', 'subFromDateTime'];
            if (functionTypesAddOrSub.includes(rhsArgument.functionType)) {
                const { functionType, arguments: funcArguments } = rhsArgument;

                // connectionInitials='' because inside function, cant use subFields of connection, only root-level variables allowed
                const dateArgumentSerialized = RuleSerializer.rhsArgumentSerializer(funcArguments[0], '');
                const durationArgumentSerialized = RuleSerializer.rhsArgumentSerializer(funcArguments[1], '');

                const dateArgumentKey = functionType === 'addToDate' || functionType === 'subFromDate' ? 'date' : 'dateTime';
                const functionValue: FunctionObject = {
                    func: functionType,
                    args: {
                        [dateArgumentKey]: {
                            value: dateArgumentSerialized.value[0],
                            valueSrc: dateArgumentSerialized.valueSrc[0],
                        },
                        duration: { value: durationArgumentSerialized.value[0], valueSrc: durationArgumentSerialized.valueSrc[0] },
                    },
                };

                return { value: [functionValue], valueSrc: ['func'] };
            }
        }

        if (isConstant(rhsArgument)) {
            return {
                value: [rhsArgument.value],
                valueSrc: ['value'],
            };
        }

        throw new Error('rhs format not supported');
    };

    private static equationSerializer = (eq: IEquation, aggregationVariableInitials: string): JsonRule | JsonRuleGroupExt => {
        if (isCountAggFunction(eq.lhsArgument)) {
            return RuleSerializer.countSerialzier(eq as IEquation & { lhsArgument: ICountAggFunction; rhsArgument: IConstant });
        }

        let rulePropertiesFromLhs: Pick<RuleProperties, 'field' | 'valueType' | 'operator'>;

        if (isRegularFunction(eq.lhsArgument) && eq.lhsArgument.functionType === 'toDate') {
            const argument = eq.lhsArgument.arguments[0] as IPropertyOfVariable;

            rulePropertiesFromLhs = {
                field: `${RuleSerializer.propertyOfVariableSerializer(argument, aggregationVariableInitials)}-ignoreHour`,
                valueType: ['date'],
                operator: RuleSerializer.operatorSerializer(eq.operatorBool),
            };
        } else if (isPropertyOfVariable(eq.lhsArgument)) {
            rulePropertiesFromLhs = {
                field: RuleSerializer.propertyOfVariableSerializer(eq.lhsArgument, aggregationVariableInitials),
                valueType: [RuleSerializer.getEquationValueType(eq.lhsArgument)],
                operator: RuleSerializer.operatorSerializer(eq.operatorBool),
            };
        } else {
            throw new Error('lhsArgument must be propertyOfVariable or toDate function of propertyOfVariable');
        }

        return {
            type: 'rule',
            properties: {
                ...rulePropertiesFromLhs,
                ...RuleSerializer.rhsArgumentSerializer(eq.rhsArgument, aggregationVariableInitials),
            },
        };
    };

    private static groupSerializer = (gr: IGroup, aggregationVariableInitials: string): JsonGroup => {
        return {
            id: uuid(),
            type: 'group',
            properties: {
                conjunction: gr.ruleOfGroup,
            },
            children1: Object.fromEntries(
                gr.subFormulas.map((subFormula) => [
                    uuid(),
                    RuleSerializer.formulaComponentToRuleItem(subFormula, aggregationVariableInitials) as JsonItem,
                ]),
            ),
        };
    };

    private static aggregationSerializer = (operator: IAggregationGroup['aggregation']) => {
        return operator === 'EVERY' ? 'all' : 'some';
    };

    private static aggrregationGroupSerializer = (gr: IAggregationGroup): JsonRuleGroupExt => {
        const fieldOfAggregation = gr.variableNameOfAggregation.replaceAll('.', '-');
        const aggregationVariableInitials = `${fieldOfAggregation}.`;

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
                field: fieldOfAggregation,
            },
            children1: Object.fromEntries(
                gr.subFormulas.map((subFormula) => [
                    uuid(),
                    RuleSerializer.formulaComponentToRuleItem(subFormula, aggregationVariableInitials) as JsonRule,
                ]),
            ),
        };
    };

    static formulaToJsonTreeWrapper = (formula: IFormula, entityTemplates: IEntityTemplateMap): JsonItem => {
        RuleSerializer.entityTemplates = entityTemplates;

        return RuleSerializer.formulaComponentToRuleItem(formula, '');
    };

    private static formulaComponentToRuleItem = (formula: IFormula, aggregationVariableInitials: string): JsonItem => {
        if (isEquation(formula)) {
            return RuleSerializer.equationSerializer(formula, aggregationVariableInitials);
        }

        if (isGroup(formula)) {
            return RuleSerializer.groupSerializer(formula, aggregationVariableInitials);
        }

        if (isAggregationGroup(formula)) {
            return RuleSerializer.aggrregationGroupSerializer(formula);
        }

        throw new Error('formula type not supported');
    };
}
