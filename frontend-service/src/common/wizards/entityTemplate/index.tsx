import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { ChooseCategory, chooseCategorySchema } from './ChooseCategory';
import { CreateTemplateName, createTemplateNameSchema } from './CreateTemplateName';
import { AddFields, addFieldsSchema } from './AddFields';
import { createEntityTemplateRequest, updateEntityTemplateRequest } from '../../../services/templates/enitityTemplatesService';
import { IEntityTemplatePopulated, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { replaceItemById } from '../../../utils/reactQuery';
import { ChooseIcon } from './ChooseIcon';
import fileDetails from '../../../interfaces/fileDetails';
import { ErrorToast } from '../../ErrorToast';

export interface EntityTemplateFormInputProperties {
    name: string;
    title: string;
    type: string;
    required: boolean;
    preview: boolean;
    id: string;
    options: string[];
    pattern: string;
    patternCustomErrorMessage: string;
}
export interface EntityTemplateWizardValues
    extends Omit<IEntityTemplatePopulated, 'properties' | 'iconFileId' | 'propertiesOrder' | 'propertiesPreview'> {
    properties: EntityTemplateFormInputProperties[];
    attachmentProperties: EntityTemplateFormInputProperties[];
    icon?: fileDetails;
}

const steps: StepsType<EntityTemplateWizardValues> = [
    {
        label: i18next.t('wizard.entityTemplate.chooseCategroy'),
        component: (props) => <ChooseCategory {...props} />,
        validationSchema: chooseCategorySchema,
    },
    {
        label: i18next.t('wizard.entityTemplate.chooseEntityTemplateName'),
        component: (props, { isEditMode }) => <CreateTemplateName {...props} isEditMode={isEditMode} />,
        validationSchema: createTemplateNameSchema,
    },
    {
        label: i18next.t('wizard.entityTemplate.chooseIcon'),
        component: (props) => <ChooseIcon {...props} />,
    },
    {
        label: i18next.t('wizard.entityTemplate.properties'),
        component: (props, { isEditMode, setBlock }) => <AddFields {...props} isEditMode={isEditMode} setBlock={setBlock} />,
        validationSchema: addFieldsSchema,
    },
];

const EntityTemplateWizard: React.FC<WizardBaseType<EntityTemplateWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = {
        name: '',
        displayName: '',
        icon: undefined,
        category: { displayName: '', name: '', _id: '', color: '' },
        disabled: false,
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
                    queryClient.setQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates', (prevData) => [...prevData!, data]);
                    toast.success(i18next.t('wizard.entityTemplate.createdSuccessfully'));
                }
                handleClose();
            },
            onError: (error: AxiosError) => {
                if (isEditMode) {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToEdit')} />);
                } else {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.entityTemplate.failedToCreate')} />);
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
            title={i18next.t('wizard.entityTemplate.title')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync(values)}
        />
    );
};

export { EntityTemplateWizard };
