import i18next from 'i18next';
import React from 'react';
import { StepsType, Wizard, WizardBaseType } from '..';
import { ActionManagement } from './actionsManagement';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

export interface AddActionWizardValues {
    entityTemplate: IMongoEntityTemplatePopulated;
}

export const defaultInitialValues: AddActionWizardValues = {
    entityTemplate: {
        _id: '',
        displayName: '',
        name: '',
        properties: {
            type: 'object',
            properties: {},
            required: [],
            hide: [],
        },
        category: { _id: '', displayName: '', name: '', color: '' },
        propertiesOrder: [],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: [],
        uniqueConstraints: [],
        disabled: false,
    },
};

const steps: StepsType<AddActionWizardValues> = [
    {
        label: i18next.t('wizard.relationshipTemplate.details'),
        component: (props, { isEditMode }) => <ActionManagement {...props} isEditMode={isEditMode} />,
    },
];

const AddActionToTemplateWizard: React.FC<WizardBaseType<AddActionWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { ...defaultInitialValues },
    isEditMode = false,
}) => {
    /// mutate function to update entityTemplate
    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.relationshipTemplate.title')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={mutateAsync}
        />
    );
};
