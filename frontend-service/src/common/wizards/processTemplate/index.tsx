import React from 'react';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { v4 as uuid } from 'uuid';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { ErrorToast } from '../../ErrorToast';
import { addDetailsFieldsSchema, AddDetailsFields } from './AddDetailsFields';
import { CreateTemplateName, createTemplateNameSchema } from '../entityTemplate/CreateTemplateName';
import { updateProcessTemplateRequest, createProcessTemplateRequest } from '../../../services/templates/processTemplatesService';
import { AddStepsFields, addStepsFieldsSchema } from './AddStepsFields';
import fileDetails from '../../../interfaces/fileDetails';
import { IUser } from '../../../services/kartoffelService';
import { IMongoProcessTemplatePopulated, IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';

export interface ProcessTemplateFormInputProperties {
    name: string;
    title: string;
    type: string;
    id: string;
    options: string[];
    pattern: string;
    patternCustomErrorMessage: string;
    required: boolean;
}
export interface ProcessTemplateWizardValues extends Omit<IMongoProcessTemplatePopulated, 'details' | 'steps' | 'createdAt' | 'updatedAt'> {
    detailsProperties: ProcessTemplateFormInputProperties[];
    detailsAttachmentProperties: ProcessTemplateFormInputProperties[];
    steps: Array<{
        _id?: string;
        draggableId: string;
        name: string;
        displayName: string;
        properties: ProcessTemplateFormInputProperties[];
        attachmentProperties: ProcessTemplateFormInputProperties[];
        reviewers: IUser[];
        icon?: fileDetails;
    }>;
}

const stepsComponents: StepsType<ProcessTemplateWizardValues> = [
    {
        label: i18next.t('wizard.processTemplate.chooseProcessTemplateName'),
        component: (props, { isEditMode }) => <CreateTemplateName {...props} isEditMode={isEditMode} />,
        validationSchema: createTemplateNameSchema,
    },
    {
        label: i18next.t('wizard.processTemplate.otherDetails'),
        component: (props, { isEditMode, setBlock }) => <AddDetailsFields {...props} isEditMode={isEditMode} setBlock={setBlock} />,
        validationSchema: addDetailsFieldsSchema,
    },
    {
        label: i18next.t('wizard.processTemplate.levels'),
        component: (props, { isEditMode, setBlock }) => <AddStepsFields {...props} isEditMode={isEditMode} setBlock={setBlock} />,
        validationSchema: addStepsFieldsSchema,
    },
];

const ProcessTemplateWizard: React.FC<WizardBaseType<ProcessTemplateWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = {
        _id: uuid(),
        createdAt: '',
        updatedAt: '',
        name: '',
        displayName: '',
        detailsProperties: [],
        detailsAttachmentProperties: [],
        steps: [],
    },
    isEditMode = false,
    refetchQuery,
}) => {
    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation(
        (processTemplate: ProcessTemplateWizardValues) =>
            isEditMode
                ? updateProcessTemplateRequest((initialValues as ProcessTemplateWizardValues & { _id: string })._id, processTemplate)
                : createProcessTemplateRequest(processTemplate),
        {
            onSuccess: (data) => {
                queryClient.setQueryData<IProcessTemplateMap>('getProcessTemplates', (prevData) => prevData!.set(data._id, data));
                if (isEditMode) {
                    toast.success(i18next.t('wizard.processTemplate.editedSuccefully'));
                } else {
                    toast.success(i18next.t('wizard.processTemplate.createdSuccessfully'));
                }
                handleClose();
            },
            onError: (error: AxiosError) => {
                if (isEditMode) {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.processTemplate.failedToEdit')} />);
                } else {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.processTemplate.failedToCreate')} />);
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
            title={i18next.t(isEditMode ? 'wizard.processTemplate.editTitle' : 'wizard.processTemplate.title')}
            steps={stepsComponents}
            isLoading={isLoading}
            submitFucntion={(values) => {
                refetchQuery?.();
                return mutateAsync(values);
            }}
        />
    );
};

export { ProcessTemplateWizard };
