import { FileDetails } from '@packages/common';
import { IWorkspace, WorkspaceTypes } from '@packages/workspace';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import { ErrorToast } from '../../../common/ErrorToast';
import { StepType, Wizard, WizardBaseType } from '../../../common/wizards/index';
import { createOne, updateOne } from '../../../services/workspacesService';
import { getFileName } from '../../../utils/getFileName';
// import { ChooseColors, chooseColorsSchema } from './ChooseColors';
import { ChooseDetails, chooseDetailsSchema } from './ChooseDetails';
import { ChooseIcons } from './ChooseIcons';

export interface WorkspaceWizardValues extends Omit<IWorkspace, '_id' | 'path' | 'iconFileId' | 'logoFileId'> {
    icon?: FileDetails;
    logo?: FileDetails;
}

const steps: StepType<WorkspaceWizardValues>[] = [
    {
        label: i18next.t('wizard.workspace.chooseDetails'),
        component: (props, { isEditMode }) => <ChooseDetails {...props} isEditMode={isEditMode} />,
        validationSchema: chooseDetailsSchema,
    },
    {
        label: i18next.t('wizard.workspace.chooseIcons'),
        component: (props) => <ChooseIcons {...props} />,
    },
    // TODO implement after pallete
    // {
    //     label: i18next.t('wizard.workspace.chooseColors'),
    //     component: (props) => <ChooseColors {...props} />,
    //     validationSchema: chooseColorsSchema,
    // },
];

export const workspaceObjectToWorkspaceForm = (workspace: IWorkspace | null): WorkspaceWizardValues | undefined => {
    if (!workspace) return undefined;
    const { iconFileId, logoFileId, ...workspaceValues } = workspace as IWorkspace & WorkspaceWizardValues;

    if (iconFileId) workspaceValues.icon = { file: { name: iconFileId }, name: getFileName(iconFileId) };
    if (logoFileId) workspaceValues.logo = { file: { name: logoFileId }, name: getFileName(logoFileId) };

    return workspaceValues;
};

export const WorkspaceWizard: React.FC<WizardBaseType<WorkspaceWizardValues>> = ({
    open,
    handleClose,
    initialStep = 0,
    initialValues = {
        name: '',
        displayName: '',
        type: WorkspaceTypes.dir,
        icon: undefined,
        logo: undefined,
        colors: { primary: '#2D3686' },
    },
    isEditMode = false,
}) => {
    const [location] = useLocation();

    const queryClient = useQueryClient();

    const { isLoading, mutateAsync } = useMutation(
        ({ _id, ...workspaceValues }: WorkspaceWizardValues & { _id?: string }) => {
            const workspace = { ...workspaceValues, path: location };
            return isEditMode === true ? updateOne(_id!, workspace) : createOne(workspace);
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['getDir', location] });

                toast.success(i18next.t(isEditMode ? 'wizard.workspace.editedSuccessfully' : 'wizard.workspace.createdSuccessfully'));
                handleClose();
            },
            onError: (error: AxiosError) => {
                if (isEditMode) toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.workspace.failedToEdit')} />);
                else toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.workspace.failedToCreate')} />);
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
            title={i18next.t('wizard.workspace.title')}
            steps={steps}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
        />
    );
};
