import React, { useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { Query, Builder, Config, ImmutableTree, BuilderProps, BasicConfig, Utils, JsonItem } from 'react-awesome-query-builder';
import i18next from 'i18next';
import { StepComponentProps, StepsType } from '../index';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { entityTemplatesToFieldsConfig } from '../../../utils/rules/fields';
import { RelationshipTemplateRuleWizardValues } from '.';
import VanillaConjs from './VanillaConjs';
import 'react-awesome-query-builder/lib/css/styles.css';
import './rules.css';
import { RuleParser } from '../../../utils/rules/parser';

export const formulaValidation: StepsType<RelationshipTemplateRuleWizardValues>[number]['validate'] = (values) => {
    try {
        RuleParser.jsonTreeToFormula(Utils.getTree(values.formula) as JsonItem);
    } catch (err) {
        return {
            formula:
                (err as Error).message === 'count aggregation doesn`t support subFormulas'
                    ? i18next.t('wizard.rule.countAggregationCantHaveSubFormulas')
                    : i18next.t('wizard.rule.invalidFormula'),
        };
    }

    return {};
};

const CreateFormula: React.FC<StepComponentProps<RelationshipTemplateRuleWizardValues>> = ({ values, setFieldValue, errors }) => {
    const queryClient = useQueryClient();

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const { pinnedEntityTemplateId, relationshipTemplateId } = values;

    const selectedRelationshipTemplate = relationshipTemplates.get(relationshipTemplateId)!;

    const config: Config = {
        ...BasicConfig,
        settings: {
            ...BasicConfig.settings,
            showNot: false,
            // @ts-ignore
            renderConjs: (props) => <VanillaConjs {...props} />,
        },
        operators: {
            equal: BasicConfig.operators.equal,
            not_equal: BasicConfig.operators.not_equal,
            less: BasicConfig.operators.less,
            less_or_equal: BasicConfig.operators.less_or_equal,
            greater: BasicConfig.operators.greater,
            greater_or_equal: BasicConfig.operators.greater_or_equal,
            // @ts-ignore
            some: BasicConfig.operators.some,
            // @ts-ignore
            all: BasicConfig.operators.all,
        },
        fields: entityTemplatesToFieldsConfig(pinnedEntityTemplateId, selectedRelationshipTemplate, entityTemplates, relationshipTemplates),
    };

    const onChange = useCallback((immutableTree: ImmutableTree) => {
        setFieldValue('formula', immutableTree);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const renderBuilder = useCallback((props: BuilderProps) => {
        return (
            <div className="query-builder-container" style={{ padding: '10px', direction: 'ltr', width: '50vw' }}>
                <div className="query-builder">
                    <Builder {...props} />
                </div>
            </div>
        );
    }, []);

    return (
        <>
            <Query {...config} value={values.formula} onChange={onChange} renderBuilder={renderBuilder} />
            {errors.formula && <div style={{ color: '#d32f2f', fontSize: 'larger' }}>{errors.formula}</div>}
        </>
    );
};

export { CreateFormula };
