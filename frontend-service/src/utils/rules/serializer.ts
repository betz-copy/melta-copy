import { JsonGroup, JsonItem, JsonRule, JsonRuleGroupExt, RuleProperties } from '@react-awesome-query-builder/mui';
import { v4 as uuid } from 'uuid';
import { IEntitySingleProperty, IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IFormula } from '../../interfaces/rules/formula';
import { FunctionObject, ValueType } from './interfaces';
import { IArgument, IConstant, IPropertyOfVariable, IVariable, isConstant, isPropertyOfVariable } from '../../interfaces/rules/formula/argument';
import { IEquation, IOperatorBool, isEquation } from '../../interfaces/rules/formula/equation';
import { ICountAggFunction, IRegularFunction, isCountAggFunction, isRegularFunction } from '../../interfaces/rules/formula/function';
import { IAggregationGroup, IGroup, isAggregationGroup, isGroup } from '../../interfaces/rules/formula/group';
import { environment } from '../../globals';

const { formulaGetTodayVarName } = environment;

export class RuleSerializer {
    private static entityTemplates: IEntityTemplateMap = new Map();

    private static variableSerializer = (variable: IVariable, aggregationsContext: Required<IVariable>[]) => {
        const aggregationVariablePrefix = aggregationsContext
            .map(
                ({ entityTemplateId, aggregatedRelationship: { relationshipTemplateId, otherEntityTemplateId, variableNameSuffix } }) =>
                    `${entityTemplateId}-${relationshipTemplateId}-${otherEntityTemplateId}${variableNameSuffix ? `-${variableNameSuffix}` : ''}`,
            )
            .join('.');
        const prefix = aggregationVariablePrefix ? `${aggregationVariablePrefix}.` : '';

        const { entityTemplateId, aggregatedRelationship } = variable;

        if (!aggregatedRelationship) {
            return `${prefix}${entityTemplateId}`;
        }
        const { relationshipTemplateId, otherEntityTemplateId, variableNameSuffix } = aggregatedRelationship;

        const suffix = variableNameSuffix ? `-${variableNameSuffix}` : '';

        return `${prefix}${entityTemplateId}-${relationshipTemplateId}-${otherEntityTemplateId}${suffix}`;
    };

    private static propertyOfVariableSerializer = (argument: IPropertyOfVariable, aggregationsContext: Required<IVariable>[]) => {
        const { variable, property } = argument;

        return `${RuleSerializer.variableSerializer(variable, aggregationsContext)}-${property}`;
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

    private static countSerializer = (
        eq: IEquation & { lhsArgument: ICountAggFunction; rhsArgument: IConstant },
        aggregationsContext: Required<IVariable>[],
    ): JsonRuleGroupExt => {
        return {
            id: uuid(),
            type: 'rule_group',
            properties: {
                field: RuleSerializer.variableSerializer(eq.lhsArgument.variable, aggregationsContext),
                valueType: ['number'],
                value: [eq.rhsArgument.value],
                valueSrc: ['value'],
                operator: RuleSerializer.operatorSerializer(eq.operatorBool),
                mode: 'array',
                conjunction: 'AND',
                not: false,
            },
            children1: [],
        };
    };

    private static getValueType = (property: IEntitySingleProperty): ValueType => {
        if (property.type === 'array') throw new Error('array not supported in formulas! sorry!'); // todo: block in UI too, or support it
        if (property.type !== 'string') return property.type;

        if (property.format === 'date') return 'date';
        if (property.format === 'date-time') return 'datetime';

        return 'text';
    };

    private static getEquationValueType = (argument: IPropertyOfVariable): ValueType => {
        const { variable, property: propertyName } = argument;

        if (propertyName === '_id') return 'text';
        if (propertyName === 'disabled') return 'boolean';
        if (propertyName === 'updatedAt' || propertyName === 'createdAt') return 'datetime';

        const entityTemplateId = variable.aggregatedRelationship ? variable.aggregatedRelationship.otherEntityTemplateId : variable.entityTemplateId;
        const template = RuleSerializer.entityTemplates.get(entityTemplateId)!;
        const property = template.properties.properties[propertyName];

        if (property.format === 'relationshipReference' && property.relationshipReference) {
            const relTemplateId = property.relationshipReference!.relatedTemplateId;
            const relTemplateKey = property.relationshipReference.relatedTemplateField;
            const refTemplate = RuleSerializer.entityTemplates.get(relTemplateId)!;
            const relProperty = refTemplate?.properties.properties[relTemplateKey];
            return this.getValueType(relProperty);
        }
        return this.getValueType(property);
    };

    private static rhsArgumentSerializer = (
        rhsArgument: IArgument,
        aggregationsContext: Required<IVariable>[],
    ): { value: RuleProperties['value']; valueSrc: NonNullable<RuleProperties['valueSrc']> } => {
        if (isPropertyOfVariable(rhsArgument)) {
            return {
                value: [RuleSerializer.propertyOfVariableSerializer(rhsArgument, aggregationsContext)],
                valueSrc: ['field'],
            };
        }

        if (isRegularFunction(rhsArgument)) {
            if (rhsArgument.functionType === 'getToday') {
                return {
                    value: [formulaGetTodayVarName],
                    valueSrc: ['field'],
                };
            }
            if (rhsArgument.functionType === 'toDate') {
                return {
                    value: [
                        `${RuleSerializer.propertyOfVariableSerializer(
                            rhsArgument.arguments[0] as IPropertyOfVariable,
                            aggregationsContext,
                        )}-ignoreHour`,
                    ],
                    valueSrc: ['field'],
                };
            }

            const functionTypesAddOrSub: Array<IRegularFunction['functionType']> = ['addToDate', 'addToDateTime', 'subFromDate', 'subFromDateTime'];
            if (functionTypesAddOrSub.includes(rhsArgument.functionType)) {
                const { functionType, arguments: funcArguments } = rhsArgument;

                // connectionInitials='' because inside function, cant use subFields of connection, only root-level variables allowed // todo: recheck what to do here
                const dateArgumentSerialized = RuleSerializer.rhsArgumentSerializer(funcArguments[0], aggregationsContext);
                const durationArgumentSerialized = RuleSerializer.rhsArgumentSerializer(funcArguments[1], aggregationsContext);

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

    private static equationSerializer = (eq: IEquation, aggregationsContext: Required<IVariable>[]): JsonRule | JsonRuleGroupExt => {
        if (isCountAggFunction(eq.lhsArgument)) {
            return RuleSerializer.countSerializer(eq as IEquation & { lhsArgument: ICountAggFunction; rhsArgument: IConstant }, aggregationsContext);
        }

        let lhsField: RuleProperties['field'];
        let valueType: RuleProperties['valueType'];

        if (isRegularFunction(eq.lhsArgument) && eq.lhsArgument.functionType === 'toDate') {
            const argument = eq.lhsArgument.arguments[0] as IPropertyOfVariable;

            lhsField = `${RuleSerializer.propertyOfVariableSerializer(argument, aggregationsContext)}-ignoreHour`;
            valueType = ['date'];
        } else if (isRegularFunction(eq.lhsArgument) && eq.lhsArgument.functionType === 'getToday') {
            lhsField = formulaGetTodayVarName;
            valueType = ['date'];
        } else if (isPropertyOfVariable(eq.lhsArgument)) {
            lhsField = RuleSerializer.propertyOfVariableSerializer(eq.lhsArgument, aggregationsContext);
            valueType = [RuleSerializer.getEquationValueType(eq.lhsArgument)];
        } else {
            throw new Error('lhsArgument must be propertyOfVariable or toDate function of propertyOfVariable');
        }

        return {
            id: uuid(),
            type: 'rule',
            properties: {
                field: lhsField,
                valueType,
                operator: RuleSerializer.operatorSerializer(eq.operatorBool),
                ...RuleSerializer.rhsArgumentSerializer(eq.rhsArgument, aggregationsContext),
            },
        };
    };

    private static groupSerializer = (gr: IGroup, aggregationsContext: Required<IVariable>[]): JsonGroup => {
        return {
            id: uuid(),
            type: 'group',
            properties: {
                conjunction: gr.ruleOfGroup,
            },
            children1: gr.subFormulas.map((subFormula) => RuleSerializer.formulaComponentToRuleItem(subFormula, aggregationsContext) as JsonItem),
        };
    };

    private static aggregationSerializer = (operator: IAggregationGroup['aggregation']) => {
        return operator === 'EVERY' ? 'all' : 'some';
    };

    private static aggrregationGroupSerializer = (gr: IAggregationGroup, aggregationsContext: Required<IVariable>[]): JsonRuleGroupExt => {
        return {
            id: uuid(),
            type: 'rule_group',
            properties: {
                operator: RuleSerializer.aggregationSerializer(gr.aggregation),
                mode: 'array',
                valueType: [],
                value: [],
                valueSrc: [],
                not: false,
                conjunction: gr.ruleOfGroup,
                field: RuleSerializer.variableSerializer(gr.variableOfAggregation, aggregationsContext),
            },
            children1: gr.subFormulas.map(
                (subFormula) => RuleSerializer.formulaComponentToRuleItem(subFormula, [...aggregationsContext, gr.variableOfAggregation]) as JsonRule,
            ),
        };
    };

    static formulaToJsonTreeWrapper = (formula: IFormula, entityTemplates: IEntityTemplateMap): JsonItem => {
        RuleSerializer.entityTemplates = entityTemplates;

        return RuleSerializer.formulaComponentToRuleItem(formula, []);
    };

    private static formulaComponentToRuleItem = (formula: IFormula, aggregationsContext: Required<IVariable>[]): JsonItem => {
        if (isEquation(formula)) {
            return RuleSerializer.equationSerializer(formula, aggregationsContext);
        }

        if (isGroup(formula)) {
            return RuleSerializer.groupSerializer(formula, aggregationsContext);
        }

        if (isAggregationGroup(formula)) {
            return RuleSerializer.aggrregationGroupSerializer(formula, aggregationsContext);
        }

        throw new Error('formula type not supported');
    };
}
