import { FileDetails } from '@packages/common';
import { IMongoProcessTemplateReviewerPopulated, IProcessTemplateMap } from '@packages/process';
import { IUser } from '@packages/user';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { v4 as uuid } from 'uuid';
import { createProcessTemplateRequest, updateProcessTemplateRequest } from '../../../services/templates/processTemplatesService';
import { ErrorToast } from '../../ErrorToast';
import { PropertyWizardType } from '../entityTemplate';
import { CreateTemplateName, useCreateOrEditTemplateNameSchema } from '../entityTemplate/CreateTemplateName'; // Import the schema
import { StepType, Wizard, WizardBaseType } from '../index';
import { AddDetailsFields, addDetailsFieldsSchema } from './AddDetailsFields';
import { AddStepsFields, addStepsFieldsSchema } from './AddStepsFields';

export interface ProcessTemplateFormInputProperties {
    name: string;
    title: string;
    type: PropertyWizardType;
    id: string;
    options: string[];
    pattern: string;
    patternCustomErrorMessage: string;
    required: boolean;
    deleted?: boolean | undefined;
}

export type ProcessTemplatePropertyByType = { type: 'field'; data: ProcessTemplateFormInputProperties };

export interface ProcessTemplateWizardValues extends Omit<IMongoProcessTemplateReviewerPopulated, 'details' | 'steps' | 'createdAt' | 'updatedAt'> {
    detailsProperties: ProcessTemplatePropertyByType[];
    detailsAttachmentProperties: ProcessTemplatePropertyByType[];
    steps: Array<{
        _id?: string;
        draggableId: string;
        name: string;
        displayName: string;
        properties: ProcessTemplatePropertyByType[];
        attachmentProperties: ProcessTemplatePropertyByType[];
        reviewers: IUser[];
        disableAddingReviewers?: boolean;
        icon?: FileDetails;
    }>;
}

const ProcessTemplateWizard: React.FC<WizardBaseType<ProcessTemplateWizardValues>> = ({
    open,
    handleClose,
    initialStep = 0,
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
}) => {
    const queryClient = useQueryClient();
    const templates = queryClient.getQueryData<IProcessTemplateMap>('getProcessTemplates')!;

    const createTemplateSettingsSchema = useCreateOrEditTemplateNameSchema(templates, initialValues._id);

    const { isLoading, mutateAsync } = useMutation(
        (processTemplate: ProcessTemplateWizardValues) =>
            isEditMode
                ? updateProcessTemplateRequest((initialValues as ProcessTemplateWizardValues & { _id: string })._id, processTemplate)
                : createProcessTemplateRequest(processTemplate),
        {
            onSuccess: (data) => {
                queryClient.setQueryData<IProcessTemplateMap>('getProcessTemplates', (prevData) => prevData!.set(data._id, data));
                queryClient.invalidateQueries(['searchProcessTemplates']);
                if (isEditMode) {
                    toast.success(i18next.t('wizard.processTemplate.editedSuccessfully'));
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

    const stepsComponents: StepType<ProcessTemplateWizardValues>[] = [
        {
            label: i18next.t('wizard.processTemplate.chooseProcessTemplateName'),
            component: (props, { isEditMode }) => (
                <CreateTemplateName {...props} isEditMode={isEditMode} gridProps={{ direction: 'column', alignItems: 'center', spacing: 1 }} />
            ),
            validationSchema: createTemplateSettingsSchema.omit(['category']),
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

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initialStep={initialStep}
            isEditMode={isEditMode}
            title={
                isEditMode
                    ? `${i18next.t('wizard.processTemplate.updateTitle')} - ${initialValues.displayName}`
                    : i18next.t('wizard.processTemplate.createTitle')
            }
            steps={stepsComponents}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
        />
    );
};

export { ProcessTemplateWizard };
