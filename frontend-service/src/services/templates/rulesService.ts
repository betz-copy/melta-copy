import { JsonItem, JsonTree, Utils as QbUtils } from '@react-awesome-query-builder/mui';
import axios from '../../axios';
import { RuleWizardValues } from '../../common/wizards/rule';
import { environment } from '../../globals';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IMongoRule, IRule, ISearchRuleBody } from '../../interfaces/rules';
import { RuleParser } from '../../utils/rules/parser';
import { RuleSerializer } from '../../utils/rules/serializer';

const { rules } = environment.api;

const ruleObjectToRuleForm = (rule: IRule | null, entityTemplates: IEntityTemplateMap): RuleWizardValues | undefined => {
    if (!rule) return undefined;
    const { formula, ...restOfRule } = rule;

    const jsonTree = RuleSerializer.formulaToJsonTreeWrapper(formula, entityTemplates);

    return {
        ...restOfRule,
        formula: QbUtils.loadTree({ ...jsonTree, properties: { ...jsonTree.properties, isLocked: true } } as JsonTree),
    };
};

const searchRulesRequest = async (searchBody: ISearchRuleBody) => {
    const { data } = await axios.post<IMongoRule[]>(`${rules}/search`, searchBody);
    return data;
};

const updateDisabledRuleRequest = async (ruleId: string, disabled: boolean) => {
    const { data } = await axios.patch<IMongoRule>(`${rules}/${ruleId}/status`, { disabled });
    return data;
};

const createRuleRequest = async (newRule: RuleWizardValues) => {
    const { data } = await axios.post<IMongoRule>(rules, {
        ...newRule,
        formula: RuleParser.jsonTreeToFormula(QbUtils.getTree(newRule.formula) as JsonItem),
    });
    return data;
};

const updateRuleRequest = async (ruleId: string, { name, description, actionOnFail, fieldColor, mail }: RuleWizardValues) => {
    const { data } = await axios.put<IMongoRule>(`${rules}/${ruleId}`, { name, description, actionOnFail, fieldColor, mail });
    return data;
};

const deleteRuleRequest = async (ruleId: string) => {
    const { data } = await axios.delete<IMongoRule>(`${rules}/${ruleId}`);
    return data;
};

export { createRuleRequest, deleteRuleRequest, ruleObjectToRuleForm, searchRulesRequest, updateDisabledRuleRequest, updateRuleRequest };
