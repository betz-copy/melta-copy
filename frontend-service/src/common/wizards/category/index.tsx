/* eslint-disable react/no-unstable-nested-components */
import { AxiosError } from 'axios';
import { ICategory, ICategoryMap } from '@microservices/shared-interfaces';
import { StepType, Wizard, WizardBaseType } from '../index';
import { CreateCategoryName, useCreateCategoryNameSchema } from './CreateCategoryName';
import { createCategoryRequest, updateCategoryRequest } from '../../../services/templates/categoriesService';
import { ChooseIcon } from './ChooseIcon';
import { ChooseColor, chooseColorSchema } from './ChooseColor';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import fileDetails from '../../../interfaces/fileDetails';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { ErrorToast } from '../../ErrorToast';
import { updateUserPermissionForCategory } from '../../../utils/permissions/templatePermissions';

export interface CategoryWizardValues extends Omit<ICategory, 'iconFileId'> {
    icon?: fileDetails;
}

const CategoryWizard: React.FC<WizardBaseType<CategoryWizardValues>> = ({
    open,
    handleClose,
    initialStep = 0,
    initialValues = { name: '', displayName: '', icon: undefined, color: '' },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const currentUser = useUserStore((state) => state.user);
    const setUser = useUserStore((state) => state.setUser);
    const currentWorkspace = useWorkspaceStore((state) => state.workspace);

    const currentCategoryId = isEditMode ? (initialValues as CategoryWizardValues & { _id: string })._id : undefined;

    const { isLoading, mutateAsync } = useMutation(
        (category: CategoryWizardValues) =>
            isEditMode === true
                ? updateCategoryRequest((initialValues as CategoryWizardValues & { _id: string })._id, category)
                : createCategoryRequest(category),
        {
            onSuccess: (data) => {
                queryClient.setQueryData<ICategoryMap>('getCategories', (categories) => categories!.set(data._id, data));
                const updatedUserPermissions = updateUserPermissionForCategory(data, currentUser, currentWorkspace._id);
                setUser(updatedUserPermissions);
                toast.success(i18next.t(isEditMode ? 'wizard.category.editedSuccessfully' : 'wizard.category.createdSuccessfully'));
                handleClose();
            },
            onError: (error: AxiosError<{ metadata: { errorCode: string } }>) => {
                if (isEditMode) {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.category.failedToEdit')} />);
                } else {
                    toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.category.failedToCreate')} />);
                }
            },
        },
    );

    const steps: StepType<CategoryWizardValues>[] = [
        {
            label: i18next.t('wizard.category.chooseName'),
            // eslint-disable-next-line @typescript-eslint/no-shadow
            component: (props, { isEditMode }) => <CreateCategoryName {...props} isEditMode={isEditMode} />,
            validationSchema: useCreateCategoryNameSchema(currentCategoryId),
        },
        {
            label: i18next.t('wizard.category.chooseIcon'),
            component: (props) => <ChooseIcon {...props} />,
        },
        {
            label: i18next.t('wizard.category.chooseColor'),
            component: (props) => <ChooseColor {...props} />,
            validationSchema: chooseColorSchema,
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
                isEditMode ? `${i18next.t('wizard.category.updateTitle')} - ${initialValues.displayName}` : i18next.t('wizard.category.createTitle')
            }
            steps={steps}
            isLoading={isLoading}
            submitFunction={(values) => mutateAsync(values)}
        />
    );
};

export { CategoryWizard };
