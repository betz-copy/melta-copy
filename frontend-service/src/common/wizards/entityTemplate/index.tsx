import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { ChooseCategory, chooseCategorySchema } from './ChooseCategory';
import { CreateTemplateName, createTemplateNameSchema } from './CreateTemplateName';
import { AddFields, addFieldsSchema } from './AddFields';
import { createEntityTemplateRequest, updateEntityTemplateRequest } from '../../../services/enitityTemplatesService';
import { IEntityTemplatePopulated, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { replaceItemById } from '../../../utils/reactQuery';
import { AttachmentsField, attachmentsFieldSchema } from './AttachmentsField';

export interface EntityTemplateFormInputProperties {
    name: string;
    title: string;
    type: string;
    required: boolean;
}
export interface EntityTemplateWizardValues extends Omit<IEntityTemplatePopulated, 'properties' | 'iconFileId'> {
    properties: EntityTemplateFormInputProperties[];
    attachmentProperties: EntityTemplateFormInputProperties[];
    file?: Partial<File>;
}

const steps: StepsType<EntityTemplateWizardValues> = [
    {
        label: i18next.t('wizard.entityTemplate.chooseCategroy'),
        component: (props) => <ChooseCategory {...props} />,
        validation: chooseCategorySchema,
    },
    {
        label: i18next.t('wizard.entityTemplate.chooseEntityTemplateName'),
        component: (props) => <CreateTemplateName {...props} />,
        validation: createTemplateNameSchema,
    },
    {
        label: i18next.t('wizard.entityTemplate.requiredProrerites'),
        component: (props) => <AddFields {...props} />,
        validation: addFieldsSchema,
    },
    {
        label: i18next.t('wizard.entityTemplate.attachments'),
        component: (props) => <AttachmentsField {...props} />,
        validation: attachmentsFieldSchema,
    },
];

const EntityTemplateWizard: React.FC<WizardBaseType<EntityTemplateWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = {
        name: '',
        displayName: '',
        file: undefined,
        category: { displayName: '', name: '', _id: '', color: '' },
        properties: [],
        attachmentProperties: [],
    },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation(
        (enitiyTemplate: EntityTemplateWizardValues) =>
            isEditMode
                ? updateEntityTemplateRequest((initialValues as EntityTemplateWizardValues & { _id: string })._id, enitiyTemplate)
                : createEntityTemplateRequest(enitiyTemplate),
        {
            onSuccess: (data) => {
                if (isEditMode) {
                    queryClient.setQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates', (prevData) => replaceItemById(data, prevData));
                    toast.success(i18next.t('wizard.entityTemplate.editedSuccefully'));
                } else {
                    queryClient.setQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates', (prevData) => [...(prevData || []), data]);
                    toast.success(i18next.t('wizard.entityTemplate.createdSuccessfully'));
                }
                handleClose();
            },
            onError: () => {
                toast.error(i18next.t('wizard.entityTemplate.failedToCreate'));
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
            title={i18next.t('wizard.entityTemplate.title')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync(values)}
        />
    );
};

export { EntityTemplateWizard };
