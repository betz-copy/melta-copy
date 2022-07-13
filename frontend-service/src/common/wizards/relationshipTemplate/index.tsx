import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema } from './CreateRelationshipTemplate';
import {
    createRelationshipTemplateRequest,
    updateRelationshipTemplateRequest,
    relationshipTemplateFormToRelationshipTemplateObject,
} from '../../../services/templates/relationshipTemplatesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { replaceItemById } from '../../../utils/reactQuery';
import { IMongoRelationshipTemplate } from '../../../interfaces/relationshipTemplates';

export interface RelationshipTemplateWizardValues {
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
    name: string;
    displayName: string;
    sourceEntity: IMongoEntityTemplatePopulated;
    destinationEntity: IMongoEntityTemplatePopulated;
}

const steps: StepsType<RelationshipTemplateWizardValues> = [
    {
        label: i18next.t('wizard.relationshipTemplate.title'),
        component: (props) => <CreateRelationshipTemplateName {...props} />,
        validationSchema: createRelationshipTemplateNameSchema,
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
            propertiesOrder: [],
            propertiesPreview: [],
        },
        destinationEntity: {
            _id: '',
            displayName: '',
            name: '',
            properties: { type: 'object', properties: {}, required: [] },
            category: { _id: '', displayName: '', name: '', color: '' },
            propertiesOrder: [],
            propertiesPreview: [],
        },
    },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation(
        (relationshipTemplateForm: RelationshipTemplateWizardValues) => {
            const { _id, createdAt, updatedAt, ...restOfRelationshipTemplateForm } = relationshipTemplateForm;
            const relationshipTemplateBody = relationshipTemplateFormToRelationshipTemplateObject(restOfRelationshipTemplateForm);
            if (isEditMode) {
                return updateRelationshipTemplateRequest(_id!, relationshipTemplateBody);
            }
            return createRelationshipTemplateRequest(relationshipTemplateBody);
        },
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
            submitFucntion={mutateAsync}
        />
    );
};

export { RelationshipTemplateWizard };
