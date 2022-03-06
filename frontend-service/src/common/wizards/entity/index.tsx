import React from 'react';

import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { ChooseTemplate, chooseTemplateSchema } from './ChooseTemplate';
import { FillFields, fillFieldsSchema } from './FillFields';
import { createEntityInstanceRequest } from '../../../services/instancesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

export interface EntityWizardValues {
    template: IMongoEntityTemplatePopulated;
    properties: object;
}

const steps: StepsType<EntityWizardValues> = [
    {
        label: 'בחר תבנית',
        component: (props) => <ChooseTemplate {...props} />,
        validation: chooseTemplateSchema,
    },
    {
        label: 'מלא פרטים',
        component: (props) => <FillFields {...props} />,
        validation: fillFieldsSchema,
    },
];

const EntityWizard: React.FC<WizardBaseType<EntityWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = {
        template: {
            _id: '',
            displayName: '',
            name: '',
            category: {
                _id: '',
                name: '',
                displayName: '',
            },
            properties: {
                properties: {},
                required: [],
                type: 'object',
            },
        },
        properties: {},
    },
    isEditMode = false,
}) => {
    const { isLoading, mutateAsync } = useMutation((entityInstance: any) => createEntityInstanceRequest(entityInstance), {
        onSuccess: () => {
            toast.success('created entity instance successfully');
        },
        onError: () => {
            toast.error('failed to create entity instance');
        },
    });

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title="יצירת יישות"
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync(values)}
        />
    );
};

export { EntityWizard };
