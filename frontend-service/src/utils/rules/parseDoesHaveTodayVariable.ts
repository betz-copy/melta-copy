import { JsonGroup, JsonItem, JsonRuleGroupExt, RuleProperties } from '@react-awesome-query-builder/mui';
import { FunctionObject } from './interfaces';
import { environment } from '../../globals';

const { formulaGetTodayVarName } = environment;

const functionHasTodayVar = ({ args }: FunctionObject): boolean => {
    return Object.values(args).some((arg) => {
        if (arg.valueSrc === 'field' && arg.value === formulaGetTodayVarName) return true;
        if (arg.valueSrc === 'func') return functionHasTodayVar(arg.value);

        return false;
    });
};

const equationHasTodayVar = ({ field, valueSrc, value }: RuleProperties): boolean => {
    if (field === formulaGetTodayVarName) return true;

    if (!valueSrc || !value[0]) return false;

    const [rhsArgumentValueSrc] = valueSrc;

    if (rhsArgumentValueSrc === 'field' && value[0] === formulaGetTodayVarName) return true;

    if (rhsArgumentValueSrc === 'func') return functionHasTodayVar(value[0]);

    return false;
};

const groupHasTodayVar = (group: JsonGroup): boolean => {
    if (group.children1) return group.children1.some((child) => jsonTreeHasTodayVar(child));
    return false;
};

const aggregationGroupHasTodayVar = (group: JsonRuleGroupExt): boolean => {
    if (group.children1) return group.children1.some((child) => jsonTreeHasTodayVar(child));
    return false;
};

export const jsonTreeHasTodayVar = (child: JsonItem): boolean => {
    const { properties, type } = child;

    switch (type) {
        case 'rule':
            return equationHasTodayVar(properties);
        case 'group':
            return groupHasTodayVar(child);
        case 'rule_group':
            return aggregationGroupHasTodayVar(child as JsonRuleGroupExt);
        default:
            throw new Error('child rule not suported');
    }
};
