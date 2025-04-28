import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { IMongoEntityTemplateWithConstraintsPopulated, IRelationshipTemplateMap } from '@microservices/shared-interfaces';
import { StepType, Wizard, WizardBaseType } from '../index';
import { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema } from './CreateRelationshipTemplate';
import {
    createRelationshipTemplateRequest,
    updateRelationshipTemplateRequest,
    relationshipTemplateFormToRelationshipTemplateObject,
} from '../../../services/templates/relationshipTemplatesService';
import { ErrorToast } from '../../ErrorToast';

export interface RelationshipTemplateWizardValues {
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    name: string;
    displayName: string;
    sourceEntity: IMongoEntityTemplateWithConstraintsPopulated;
    destinationEntity: IMongoEntityTemplateWithConstraintsPopulated;
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
        category: { _id: '', displayName: '', name: '', color: '', iconFileId: null, createdAt: new Date(), updatedAt: new Date() },
        propertiesOrder: [],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: [],
        uniqueConstraints: [],
        disabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        iconFileId: null,
    },
    destinationEntity: {
        _id: '',
        displayName: '',
        name: '',
        properties: { type: 'object', properties: {}, required: [], hide: [] },
        category: { _id: '', displayName: '', name: '', color: '', iconFileId: null, createdAt: new Date(), updatedAt: new Date() },
        propertiesOrder: [],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: [],
        uniqueConstraints: [],
        disabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        iconFileId: null,
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
            const { _id, createdAt: _createdAt, updatedAt: _updatedAt, ...restOfRelationshipTemplateForm } = relationshipTemplateForm;
            const relationshipTemplateBody = relationshipTemplateFormToRelationshipTemplateObject(restOfRelationshipTemplateForm);
            const { isProperty: _isProperty, ...updatedRelationshipTemplate } = relationshipTemplateBody;
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
            onError: (error: AxiosError<{ metadata: { errorCode: string } }>) => {
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
