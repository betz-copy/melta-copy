import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from 'react-query';
import {
    Query,
    Builder,
    Config,
    ImmutableTree,
    BuilderProps,
    MuiConfig,
    Utils,
    JsonItem,
    MuiWidgets,
    Func,
    TextWidgetProps,
} from '@react-awesome-query-builder/mui';
import i18next from 'i18next';
import { Grid, ThemeProvider } from '@mui/material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { StepComponentProps, StepType } from '../index';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { getFieldsConfigOfRule } from '../../../utils/rules/fields';
import { RuleWizardValues } from '.';
import '@react-awesome-query-builder/mui/css/styles.css';
import { RuleParser } from '../../../utils/rules/parser';
import { LTRProvider } from '../../../LTRProvider';
import RaqbMuiFieldSelect from './raqb/RaqbMuiFieldSelect';
import RaqbMuiValueSources from './raqb/RaqbMuiValueSources';
import { RaqbMuiAutocompeleteAutoWidth } from './raqb/RaqbAutocompleteAutoWidth';
import { lightTheme } from '../../../theme';
import { useUserStore } from '../../../stores/user';
import { jsonTreeHasTodayVar } from '../../../utils/rules/parseDoesHaveTodayVariable';
import { environment } from '../../../globals';

const { formulaGetTodayVarName } = environment;

const { MuiTextWidget } = MuiWidgets;

export const formulaValidation: StepType<RuleWizardValues>[][number]['validate'] = (values) => {
    try {
        RuleParser.jsonTreeToFormula(Utils.getTree(values.formula) as JsonItem);
    } catch (err) {
        let formulaErr: string;
        switch ((err as Error).message) {
            case 'count aggregation doesn`t support subFormulas':
                formulaErr = i18next.t('wizard.rule.countAggregationCantHaveSubFormulas');
                break;
            case `${formulaGetTodayVarName} is not allowed inside aggregation group (for performance)`:
                formulaErr = i18next.t('wizard.rule.aggregationsCantHaveGetTodayFunc');
                break;

            default:
                formulaErr = i18next.t('wizard.rule.invalidFormula');
                break;
        }
        return { formula: formulaErr };
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

const CreateFormula: React.FC<StepComponentProps<RuleWizardValues>> = ({ values, setFieldValue, errors }) => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);

    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const { entityTemplateId, formula, actionOnFail } = values;

    const config = useMemo((): Config => {
        const fieldsConfig = getFieldsConfigOfRule(entityTemplateId, entityTemplates, relationshipTemplates, formula, actionOnFail, currentUser);

        return {
            ...MuiConfig,
            types: {
                ...MuiConfig.types,
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
                ...MuiConfig.widgets,
                dateDuration: {
                    type: 'dateDuration',
                    // eslint-disable-next-line react/no-unstable-nested-components
                    factory: (props) => <MuiTextWidget {...(props as TextWidgetProps)} />,
                    customProps: {
                        // todo: check customProps works with mui
                        pattern: dateDurationRegExp.source,
                        minLength: 1, // added at least one component of duration (Y/M/D)
                    },
                },
                dateTimeDuration: {
                    type: 'dateTimeDuration',
                    // eslint-disable-next-line react/no-unstable-nested-components
                    factory: (props) => <MuiTextWidget {...(props as TextWidgetProps)} />,
                    customProps: {
                        pattern: dateTimeDurationRegExp.source,
                        minLength: 1, // added at least one component of duration (Y/M/D)
                    },
                },
            },
            settings: {
                ...MuiConfig.settings,
                showNot: false,
                removeIncompleteRulesOnLoad: false, // dont remove empty groups on config reload
                removeEmptyGroupsOnLoad: false, // dont remove empty groups on config reload
                removeEmptyRulesOnLoad: false, // dont remove empty rules on config reload
                fieldSources: ['field'], // todo: lib supports lhs functions!, need to use it too
                renderField: (fieldProps) => <RaqbMuiAutocompeleteAutoWidth {...fieldProps} />,
                renderOperator: (operatorProps) => {
                    return <RaqbMuiFieldSelect {...operatorProps} customProps={{ MenuProps: { PaperProps: { dir: 'ltr' } } }} />;
                },
                renderValueSources: (valueSourcesProps) => <RaqbMuiValueSources {...valueSourcesProps} />,
                theme: { mui: lightTheme },
            },
            operators: {
                equal: MuiConfig.operators.equal,
                not_equal: MuiConfig.operators.not_equal,
                less: MuiConfig.operators.less,
                less_or_equal: MuiConfig.operators.less_or_equal,
                greater: MuiConfig.operators.greater,
                greater_or_equal: MuiConfig.operators.greater_or_equal,
                some: MuiConfig.operators.some,
                all: MuiConfig.operators.all,
            },
            fields: fieldsConfig,
            funcs: {
                addToDate: getAddOrSubDateFunc(true),
                addToDateTime: getAddOrSubDateTimeFunc(true),
                subFromDate: getAddOrSubDateFunc(false),
                subFromDateTime: getAddOrSubDateTimeFunc(false),
                // getToday -- TODO: currently getToday function is as variable in fieldsConfig (because raqb doesnt support lhs functions see raqb issue #287. need to upgrade version)
            },
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityTemplateId, entityTemplates, relationshipTemplates, formula]);

    const [formulaHasGetTodayFunc, setFormulaHasGetTodayFunc] = useState(jsonTreeHasTodayVar(Utils.getTree(values.formula) as JsonItem));

    const onChange = useCallback((immutableTree: ImmutableTree) => {
        setFieldValue('formula', immutableTree);

        setFormulaHasGetTodayFunc(jsonTreeHasTodayVar(Utils.getTree(immutableTree) as JsonItem));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const renderBuilder = useCallback((props: BuilderProps) => {
        return (
            <LTRProvider>
                <div className="query-builder-container" style={{ padding: '10px' }}>
                    <div className="query-builder">
                        <Builder {...props} />
                    </div>
                </div>
            </LTRProvider>
        );
    }, []);

    return (
        <Grid container size={{ xs: 12 }} direction="column">
            <ThemeProvider theme={(outerTheme) => ({ ...outerTheme, direction: 'ltr' })}>
                <Query {...config} value={values.formula} onChange={onChange} renderBuilder={renderBuilder} />
            </ThemeProvider>
            {errors.formula && (
                <Grid container alignItems="center" sx={{ color: '#d32f2f' }}>
                    <PriorityHighIcon />
                    <div style={{ fontSize: '14px' }}>{String(errors.formula)}</div>
                </Grid>
            )}
            {formulaHasGetTodayFunc && (
                <Grid container wrap="nowrap" alignItems="center" sx={{ color: '#FFAC2F' }}>
                    <PriorityHighIcon />
                    <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{i18next.t('wizard.rule.todayVariableInfo')}</div>
                </Grid>
            )}
        </Grid>
    );
};

export { CreateFormula };
