import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema } from './CreateRelationshipTemplate';
import { createRelationshipTemplateRequest, updateRelationshipTemplateRequest } from '../../../services/templates/relationshipTemplatesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { replaceItemById } from '../../../utils/reactQuery';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';

export interface RelationshipTemplateWizardValues {
    name: string;
    displayName: string;
    sourceEntity: IMongoEntityTemplatePopulated;
    destinationEntity: IMongoEntityTemplatePopulated;
}

const steps: StepsType<RelationshipTemplateWizardValues> = [
    {
        label: i18next.t('wizard.relationshipTemplate.title'),
        component: (props) => <CreateRelationshipTemplateName {...props} />,
        validation: createRelationshipTemplateNameSchema,
    },
];

const RelationshipTemplateWizard: React.FC<WizardBaseType<RelationshipTemplateWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = {
        name: '',
        displayName: '',
        sourceEntity: {
            _id: '',
            displayName: '',
            name: '',
            properties: {
                type: 'object',
                properties: {},
                required: [],
            },
            category: { _id: '', displayName: '', name: '', color: '' },
        },
        destinationEntity: {
            _id: '',
            displayName: '',
            name: '',
            properties: { type: 'object', properties: {}, required: [] },
            category: { _id: '', displayName: '', name: '', color: '' },
        },
    },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation(
        (relationshipTemplate: any) =>
            isEditMode
                ? updateRelationshipTemplateRequest((initialValues as RelationshipTemplateWizardValues & { _id: string })._id, relationshipTemplate)
                : createRelationshipTemplateRequest(relationshipTemplate),
        {
            onSuccess: (data) => {
                if (isEditMode) {
                    queryClient.setQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates', (prevData) => replaceItemById(data, prevData));
                    toast.success(i18next.t('wizard.relationshipTemplate.editedSuccefully'));
                } else {
                    queryClient.setQueryData<IMongoRelationshipTemplate[]>('getRelationshipTemplates', (prevData) => [...prevData!, data]);
                    toast.success(i18next.t('wizard.relationshipTemplate.createdSuccessfully'));
                }
                handleClose();
            },
            onError: () => {
                toast.error(i18next.t('wizard.relationshipTemplate.failedToCreate'));
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
            title={i18next.t('wizard.relationshipTemplate.title')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync({ data: values })}
        />
    );
};

export { RelationshipTemplateWizard };
