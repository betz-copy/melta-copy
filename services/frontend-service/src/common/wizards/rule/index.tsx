import React from 'react';

import { toast } from 'react-toastify';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { Utils as QbUtils, ImmutableTree } from '@react-awesome-query-builder/mui';

import { IRule, IRuleMap } from '@microservices/shared';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { CreateRule, createRuleSchema } from './CreateRule';
import { ErrorToast } from '../../ErrorToast';
import { createRuleRequest, updateRuleRequest } from '../../../services/templates/rulesService';
import { CreateFormula, formulaValidation } from './CreateFormula';

export interface RuleWizardValues extends Omit<IRule, 'formula'> {
    formula: ImmutableTree;
}

const steps: StepsType<RuleWizardValues> = [
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
        actionOnFail: 'WARNING',
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
                if (isEditMode) {
                    toast.success(i18next.t('wizard.rule.editedSuccessfully'));
                } else {
                    toast.success(i18next.t('wizard.rule.createdSuccessfully'));
                }
                handleClose();
            },
            onError: (error: AxiosError<{ metadata: { errorCode: string } }>) => {
                if (isEditMode) {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.rule.failedToEdit')} />);
                } else {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.rule.failedToCreate')} />);
                }
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
            title={i18next.t('wizard.rule.title')}
            steps={steps}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
        />
    );
};

export { RuleWizard };
