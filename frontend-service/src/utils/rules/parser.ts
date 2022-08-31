import { JsonGroup, RuleProperties, JsonItem, JsonRuleGroupExt } from 'react-awesome-query-builder';
import { IAggregationGroup, IEquation, IGroup, IOperatorBool } from '../../interfaces/rules';
import { IConstant, IPropertyOfVariable } from '../../interfaces/rules/argument';
import { IFormula } from '../../interfaces/rules/formula';

export class RuleParser {
    private static formatAggregationField = (field: string) => {
        return field.includes('.') ? field.split('.')[1] : field;
    };

    private static propertyParser(property): IPropertyOfVariable {
        const formattedField = RuleParser.formatAggregationField(property);

        const lastDashIndex = formattedField.lastIndexOf('-');

        const propertyName = formattedField.substring(lastDashIndex + 1);

        if (propertyName === null || propertyName === undefined) throw new Error('property can not be empty');

        return {
            isPropertyOfVariable: true,
            variableName: formattedField.substring(0, lastDashIndex).replaceAll('-', '.'),
            property: propertyName,
        };
    }

    private static constantParser = (value): IConstant => {
        if (value === null || value === undefined) throw new Error('value can not be empty');
        return {
            isConstant: true,
            value,
        };
    };

    private static operatorParser = (operator: string): IOperatorBool => {
        if (operator === 'equal') return 'equals';
        if (operator === 'not_equal') return 'notEqual';
        if (operator === 'less') return 'lessThan';
        if (operator === 'less_or_equal') return 'lessThanOrEqual';
        if (operator === 'greater') return 'greaterThan';
        if (operator === 'greater_or_equal') return 'greaterThanOrEqual';

        throw new Error('operator not supported');
    };

    private static equationParser = (properties: RuleProperties): IEquation => {
        const isRhsArgumentPropertyOfVariable = properties.valueSrc![0] === 'field';

        return {
            isEquation: true,
            operatorBool: RuleParser.operatorParser(properties.operator!),
            lhsArgument: RuleParser.propertyParser(properties.field!),
            rhsArgument: isRhsArgumentPropertyOfVariable
                ? RuleParser.propertyParser(properties.value[0])
                : RuleParser.constantParser(properties.value[0]),
        };
    };

    private static conjunctionParser = (conjunction: string | undefined) => {
        return (conjunction || 'AND') as 'AND' | 'OR';
    };

    private static aggregationParser = (operator: 'some' | 'all') => {
        return operator === 'some' ? 'SOME' : 'EVERY';
    };

    private static groupParser = (group: JsonGroup): IGroup => {
        return {
            isGroup: true,
            ruleOfGroup: RuleParser.conjunctionParser(group.properties?.conjunction),
            subFormulas: Object.values(group.children1!).map(RuleParser.jsonTreeToFormula),
        };
    };

    private static aggregationGroupParser = (ruleGroup: JsonRuleGroupExt): IAggregationGroup | IEquation => {
        if (ruleGroup.properties!.operator === 'some' || ruleGroup.properties!.operator === 'all') {
            return {
                isAggregationGroup: true,
                variableNameOfAggregation: ruleGroup.properties!.field!.replaceAll('-', '.'),
                aggregation: RuleParser.aggregationParser(ruleGroup.properties!.operator),
                ruleOfGroup: RuleParser.conjunctionParser(ruleGroup.properties!.conjunction),
                subFormulas: Object.values(ruleGroup.children1!).map(RuleParser.jsonTreeToFormula),
            } as IAggregationGroup;
        }

        if (Object.values(ruleGroup.children1!).length > 0) {
            throw new Error('count aggregation doesn`t support subFormulas');
        }

        return {
            isEquation: true,
            operatorBool: RuleParser.operatorParser(ruleGroup.properties!.operator!),
            lhsArgument: {
                isCountAggFunction: true,
                variableName: ruleGroup.properties!.field!.replaceAll('-', '.'),
            },
            rhsArgument: RuleParser.constantParser(ruleGroup.properties!.value[0]),
        } as IEquation;
    };

    static jsonTreeToFormula = (child: JsonItem): IFormula => {
        const { properties, type } = child;

        if (type === 'rule') {
            return RuleParser.equationParser(properties);
        }

        if (type === 'group') {
            return RuleParser.groupParser(child);
        }

        if (type === 'rule_group') {
            return RuleParser.aggregationGroupParser(child as JsonRuleGroupExt);
        }

        throw new Error('child rule not suported');
    };
}
