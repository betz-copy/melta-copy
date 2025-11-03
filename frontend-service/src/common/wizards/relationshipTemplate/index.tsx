import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import {
    createRelationshipTemplateRequest,
    relationshipTemplateFormToRelationshipTemplateObject,
    updateRelationshipTemplateRequest,
} from '../../../services/templates/relationshipTemplatesService';
import { ErrorToast } from '../../ErrorToast';
import { StepType, Wizard, WizardBaseType } from '../index';
import { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema } from './CreateRelationshipTemplate';

export interface RelationshipTemplateWizardValues {
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
    name: string;
    displayName: string;
    sourceEntity: IMongoEntityTemplatePopulated;
    destinationEntity: IMongoEntityTemplatePopulated;
}

export const defaultInitialValues: RelationshipTemplateWizardValues = {
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
            hide: [],
        },
        category: { _id: '', displayName: '', name: '', color: '', templatesOrder: [] },
        propertiesOrder: [],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: [],
        uniqueConstraints: [],
        disabled: false,
    },
    destinationEntity: {
        _id: '',
        displayName: '',
        name: '',
        properties: { type: 'object', properties: {}, required: [], hide: [] },
        category: { _id: '', displayName: '', name: '', color: '', templatesOrder: [] },
        propertiesOrder: [],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: [],
        uniqueConstraints: [],
        disabled: false,
    },
};

const steps: StepType<RelationshipTemplateWizardValues>[] = [
    {
        label: i18next.t('wizard.relationshipTemplate.title'),
        component: (props, { isEditMode }) => <CreateRelationshipTemplateName {...props} isEditMode={isEditMode} />,
        validationSchema: createRelationshipTemplateNameSchema,
    },
];

const RelationshipTemplateWizard: React.FC<WizardBaseType<RelationshipTemplateWizardValues>> = ({
    open,
    handleClose,
    initialStep = 0,
    initialValues = { ...defaultInitialValues },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation(
        (relationshipTemplateForm: RelationshipTemplateWizardValues) => {
            const { _id, createdAt, updatedAt, ...restOfRelationshipTemplateForm } = relationshipTemplateForm;
            const relationshipTemplateBody = relationshipTemplateFormToRelationshipTemplateObject(restOfRelationshipTemplateForm);
            const { isProperty, ...updatedRelationshipTemplate } = relationshipTemplateBody;
            if (isEditMode) {
                return updateRelationshipTemplateRequest(_id!, updatedRelationshipTemplate);
            }
            return createRelationshipTemplateRequest(relationshipTemplateBody);
        },
        {
            onSuccess: (data) => {
                queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', (relationshipTemplateMap) =>
                    relationshipTemplateMap!.set(data._id, data),
                );
                queryClient.invalidateQueries(['searchRelationshipTemplates']);

                if (isEditMode) {
                    toast.success(i18next.t('wizard.relationshipTemplate.editedSuccessfully'));
                } else {
                    toast.success(i18next.t('wizard.relationshipTemplate.createdSuccessfully'));
                }
                handleClose();
            },
            onError: (error: AxiosError) => {
                if (isEditMode) {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.relationshipTemplate.failedToEdit')} />);
                } else {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.relationshipTemplate.failedToCreate')} />);
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
            title={isEditMode ? i18next.t('wizard.relationshipTemplate.updateTitle') : i18next.t('wizard.relationshipTemplate.createTitle')}
            steps={steps}
            isLoading={isLoading}
            submitFunction={mutateAsync}
        />
    );
};

export { RelationshipTemplateWizard };
