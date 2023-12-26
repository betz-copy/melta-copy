import React, { useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { Query, Builder, Config, ImmutableTree, BuilderProps, BasicConfig, Utils, JsonItem, Widgets, Func } from 'react-awesome-query-builder';
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

const { VanillaTextWidget } = Widgets;

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

const numberRegExp = '[1-9]\\d*'; // digits that doesnt start with 0
const dateTimeDurationRegExp = new RegExp(`^(${numberRegExp}Y)?(${numberRegExp}M)?(${numberRegExp}D)?(${numberRegExp}H)?$`);
const dateDurationRegExp = new RegExp(`^(${numberRegExp}Y)?(${numberRegExp}M)?(${numberRegExp}D)?$`);

const getAddOrSubDateFunc = (isAdd: boolean): Func => ({
    label: isAdd ? 'Add(date, duration)' : 'Sub(date, duration)',
    args: {
        date: { type: 'date', label: 'date', valueSources: ['field', 'value', 'func'] },
        duration: { type: 'dateDuration', label: '[nY][nM][nD]', valueSources: ['value'] },
    },
    returnType: 'date',
});

const getAddOrSubDateTimeFunc = (isAdd: boolean): Func => ({
    label: isAdd ? 'Add(dateTime, duration)' : 'Sub(dateTime, duration)',
    args: {
        dateTime: { type: 'datetime', label: 'dateTime', valueSources: ['field', 'value', 'func'] },
        duration: { type: 'dateTimeDuration', label: '[nY][nM][nD][nH]', valueSources: ['value'] },
    },
    returnType: 'datetime',
});

const CreateFormula: React.FC<StepComponentProps<RelationshipTemplateRuleWizardValues>> = ({ values, setFieldValue, errors }) => {
    const queryClient = useQueryClient();

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const { pinnedEntityTemplateId, relationshipTemplateId } = values;

    const selectedRelationshipTemplate = relationshipTemplates.get(relationshipTemplateId)!;

    const config: Config = {
        ...BasicConfig,
        types: {
            ...BasicConfig.types,
            dateDuration: {
                valueSources: ['value'],
                widgets: {
                    dateDuration: {},
                },
            },
            dateTimeDuration: {
                valueSources: ['value'],
                widgets: {
                    dateTimeDuration: {},
                },
            },
        },
        widgets: {
            ...BasicConfig.widgets,
            dateDuration: {
                type: 'dateDuration',
                // eslint-disable-next-line react/no-unstable-nested-components
                factory: (props) => <VanillaTextWidget {...props!} />,
                customProps: {
                    pattern: dateDurationRegExp.source,
                    minLength: 1, // added at least one component of duration (Y/M/D)
                },
            },
            dateTimeDuration: {
                type: 'dateTimeDuration',
                // eslint-disable-next-line react/no-unstable-nested-components
                factory: (props) => <VanillaTextWidget {...props!} />,
                customProps: {
                    pattern: dateTimeDurationRegExp.source,
                    minLength: 1, // added at least one component of duration (Y/M/D)
                },
            },
        },
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
        funcs: {
            addToDate: getAddOrSubDateFunc(true),
            addToDateTime: getAddOrSubDateTimeFunc(true),
            subFromDate: getAddOrSubDateFunc(false),
            subFromDateTime: getAddOrSubDateTimeFunc(false),
        },
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
