import React from 'react';

import { toast } from 'react-toastify';
import { useMutation } from 'react-query';
import i18next from 'i18next';
import { useNavigate } from 'react-router-dom';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { ChooseTemplate, chooseTemplateSchema } from './ChooseTemplate';
import { FillFields, fillFieldsValidate } from './FillFields';
import { Summary } from './Summary';
import { createEntityRequest } from '../../../services/entitiesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { FileFields, fileFieldsSchema } from './FileFields';

export interface EntityWizardValues {
    template: IMongoEntityTemplatePopulated;
    properties: object;
    attachmentsProperties: object;
}

const steps: StepsType<EntityWizardValues> = [
    {
        label: i18next.t('wizard.entity.chooseEntityTemplate'),
        component: (props) => <ChooseTemplate {...props} />,
        validationSchema: chooseTemplateSchema,
    },
    {
        label: i18next.t('wizard.entity.fillFields'),
        component: (props) => <FillFields {...props} />,
        validate: fillFieldsValidate,
    },
    {
        label: i18next.t('wizard.entity.fileFields'),
        component: (props) => <FileFields {...props} />,
        validationSchema: fileFieldsSchema,
    },
    {
        label: i18next.t('wizard.entity.summary'),
        component: (props) => <Summary {...props} />,
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
                color: '',
            },
            properties: {
                properties: {},
                required: [],
                type: 'object',
            },
            propertiesOrder: [],
            propertiesPreview: [],
        },
        properties: {},
        attachmentsProperties: {},
    },
    isEditMode = false,
}) => {
    const navigate = useNavigate();

    const { isLoading, mutateAsync } = useMutation((entity: any) => createEntityRequest(entity), {
        onSuccess: (newEntity) => {
            toast.success(i18next.t('wizard.entity.createdSuccessfully'));
            handleClose();
            navigate(`/entity/${newEntity.properties._id}`);
        },
        onError: () => {
            toast.error(i18next.t('wizard.entity.failedToCreate'));
        },
    });

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.entity.title')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync(values)}
        />
    );
};

export { EntityWizard };
