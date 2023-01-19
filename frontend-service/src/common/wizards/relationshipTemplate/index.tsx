import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { CreateRelationshipTemplateName, createRelationshipTemplateNameSchema } from './CreateRelationshipTemplate';
import {
    createRelationshipTemplateRequest,
    updateRelationshipTemplateRequest,
    relationshipTemplateFormToRelationshipTemplateObject,
} from '../../../services/templates/relationshipTemplatesService';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IRelationshipTemplateMap } from '../../../interfaces/relationshipTemplates';
import { ErrorToast } from '../../ErrorToast';

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
        component: (props, { isEditMode }) => <CreateRelationshipTemplateName {...props} isEditMode={isEditMode} />,
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
                hide: [],
            },
            category: { _id: '', displayName: '', name: '', color: '' },
            propertiesOrder: [],
            propertiesPreview: [],
            uniqueConstraints: [],
            disabled: false,
        },
        destinationEntity: {
            _id: '',
            displayName: '',
            name: '',
            properties: { type: 'object', properties: {}, required: [], hide: [] },
            category: { _id: '', displayName: '', name: '', color: '' },
            propertiesOrder: [],
            propertiesPreview: [],
            uniqueConstraints: [],
            disabled: false,
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
                queryClient.setQueryData<IRelationshipTemplateMap>('getRelationshipTemplates', (relationshipTemplateMap) =>
                    relationshipTemplateMap!.set(data._id, data),
                );

                if (isEditMode) {
                    toast.success(i18next.t('wizard.relationshipTemplate.editedSuccefully'));
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
