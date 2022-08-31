import React from 'react';

import { toast } from 'react-toastify';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { Utils as QbUtils, ImmutableTree } from 'react-awesome-query-builder';

import { StepsType, Wizard, WizardBaseType } from '../index';
import { CreateRule, createRuleSchema } from './CreateRule';
import { replaceItemById } from '../../../utils/reactQuery';
import { ErrorToast } from '../../ErrorToast';
import { IMongoRelationshipTemplateRule, IRelationshipTemplateRule } from '../../../interfaces/rules';
import { createRuleRequest, updateRuleRequest } from '../../../services/templates/rulesService';
import { CreateFormula, formulaValidation } from './CreateFormula';

export interface RelationshipTemplateRuleWizardValues extends Omit<IRelationshipTemplateRule, 'formula'> {
    formula: ImmutableTree;
}

const steps: StepsType<RelationshipTemplateRuleWizardValues> = [
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

const RuleWizard: React.FC<WizardBaseType<RelationshipTemplateRuleWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = {
        name: '',
        description: '',
        actionOnFail: 'WARNING',
        relationshipTemplateId: '',
        pinnedEntityTemplateId: '',
        formula: QbUtils.loadTree({ id: QbUtils.uuid(), type: 'group' }),
        disabled: false,
    },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation(
        (rule: RelationshipTemplateRuleWizardValues) =>
            isEditMode === true
                ? updateRuleRequest((initialValues as RelationshipTemplateRuleWizardValues & { _id: string })._id, rule)
                : createRuleRequest(rule),
        {
            onSuccess: (data) => {
                if (isEditMode) {
                    queryClient.setQueryData<IMongoRelationshipTemplateRule[]>('getRules', (prevData) => replaceItemById(data, prevData));
                    toast.success(i18next.t('wizard.rule.editedSuccefully'));
                } else {
                    queryClient.setQueryData<IMongoRelationshipTemplateRule[]>('getRules', (prevData) => [...prevData!, data]);
                    toast.success(i18next.t('wizard.rule.createdSuccessfully'));
                }
                handleClose();
            },
            onError: (error: AxiosError) => {
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
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.rule.title')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync(values)}
        />
    );
};

export { RuleWizard };
