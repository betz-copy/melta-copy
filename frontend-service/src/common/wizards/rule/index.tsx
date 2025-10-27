import { ImmutableTree, Utils as QbUtils } from '@react-awesome-query-builder/mui';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { ActionOnFail, IRule, IRuleMap } from '../../../interfaces/rules';
import { createRuleRequest, updateRuleRequest } from '../../../services/templates/rulesService';
import { ErrorToast } from '../../ErrorToast';
import { StepType, Wizard, WizardBaseType } from '../index';
import { CreateFormula, formulaValidation } from './CreateFormula';
import { CreateRule, createRuleSchema } from './CreateRule';

export interface RuleWizardValues extends Omit<IRule, 'formula' | 'doesFormulaHaveTodayFunc'> {
    formula: ImmutableTree;
}

const steps: StepType<RuleWizardValues>[] = [
    {
        label: i18next.t('wizard.rule.ruleMetadata'),
        component: (props, { isEditMode }) => <CreateRule {...props} isEditMode={isEditMode} />,
        validationSchema: createRuleSchema,
    },
    {
        label: i18next.t('wizard.rule.formula'),
        component: (props) => <CreateFormula {...props} />,
        validate: formulaValidation,
    },
];

const RuleWizard: React.FC<WizardBaseType<RuleWizardValues>> = ({
    open,
    handleClose,
    initialStep = 0,
    initialValues = {
        name: '',
        description: '',
        actionOnFail: ActionOnFail.WARNING,
        entityTemplateId: '',
        formula: QbUtils.loadTree({ id: QbUtils.uuid(), type: 'group' }),
        disabled: false,
    },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation(
        (rule: RuleWizardValues) =>
            isEditMode ? updateRuleRequest((initialValues as RuleWizardValues & { _id: string })._id, rule) : createRuleRequest(rule),
        {
            onSuccess: (data) => {
                queryClient.setQueryData<IRuleMap>('getRules', (ruleMap) => ruleMap!.set(data._id, data));
                queryClient.invalidateQueries(['searchRulesTemplates']);
                toast.success(i18next.t(`wizard.rule.${isEditMode ? 'editedSuccessfully' : 'createdSuccessfully'}`));
                handleClose();
            },
            onError: (error: AxiosError) => {
                toast.error(
                    <ErrorToast
                        axiosError={error}
                        defaultErrorMessage={i18next.t(`wizard.rule.${isEditMode ? 'failedToEdit' : 'failedToCreate'}`)}
                    />,
                );
            },
        },
    );

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initialStep={initialStep}
            isEditMode={isEditMode}
            title={i18next.t(`wizard.rule.${isEditMode ? 'updateTitle' : 'createTitle'}`)}
            steps={steps}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
        />
    );
};

export { RuleWizard };
