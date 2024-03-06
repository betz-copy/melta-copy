import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import fileDetails from '../../../interfaces/fileDetails';
import { IWorkspace, WorkspaceTypes } from '../../../interfaces/workspaces';
import { createOne, updateOne } from '../../../services/workspacesService';
import { ErrorToast } from '../../../common/ErrorToast';
import { StepsType, Wizard, WizardBaseType } from '../../../common/wizards/index';
import { ChooseColors, chooseColorsSchema } from './ChooseColors';
import { ChooseDetails, chooseDetailsSchema } from './ChooseDetails';
import { ChooseIcons } from './ChooseIcons';

export interface WorkspaceWizardValues extends Omit<IWorkspace, 'path'> {
    // icon?: fileDetails;
}

const steps: StepsType<WorkspaceWizardValues> = [
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

export const WorkspaceWizard: React.FC<WizardBaseType<WorkspaceWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', type: WorkspaceTypes.dir, icon: undefined, logo: undefined, colors: { primary: '#2D3686' } },
    isEditMode = false,
}) => {
    const [location] = useLocation();

    const queryClient = useQueryClient();

    const { isLoading, mutateAsync } = useMutation(
        ({ _id, ...workspaceValues }: WorkspaceWizardValues) => {
            const workspace = { ...workspaceValues, path: location };

            return isEditMode === true ? updateOne(_id, workspace) : createOne(workspace);
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
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.workspace.title')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync(values)}
        />
    );
};
