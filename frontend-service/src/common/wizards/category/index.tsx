import { ICategory, ICategoryMap } from '@packages/category';
import { FileDetails } from '@packages/common';
/* eslint-disable react/no-unstable-nested-components */
import { AxiosError } from 'axios';
import i18next from 'i18next';
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { ConfigTypes, IMongoCategoryOrderConfig } from '../../../interfaces/config';
import { createCategoryRequest, updateCategoryRequest } from '../../../services/templates/categoriesService';
import { getConfigByTypeRequest } from '../../../services/templates/configService';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { updateUserPermissionForCategory } from '../../../utils/permissions/templatePermissions';
import { ErrorToast } from '../../ErrorToast';
import { StepType, Wizard, WizardBaseType } from '../index';
import { ChooseColor, chooseColorSchema } from './ChooseColor';
import { ChooseIcon } from './ChooseIcon';
import { CreateCategoryName, useCreateCategoryNameSchema } from './CreateCategoryName';

export interface CategoryWizardValues extends Omit<ICategory, 'iconFileId'> {
    icon?: FileDetails;
}

const CategoryWizard: React.FC<WizardBaseType<CategoryWizardValues>> = ({
    open,
    handleClose,
    initialStep = 0,
    initialValues = { name: '', displayName: '', icon: undefined, color: '', templatesOrder: [] },
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
            onSuccess: async (data) => {
                queryClient.setQueryData<ICategoryMap>('getCategories', (categories) => categories!.set(data._id, data));
                if (!isEditMode) {
                    const categoryOrder = queryClient.getQueryData<IMongoCategoryOrderConfig>('getCategoryOrder');

                    if (categoryOrder) {
                        queryClient.setQueryData<IMongoCategoryOrderConfig>('getCategoryOrder', (categoryConfig) => {
                            const { order } = categoryConfig!;
                            order.push(data._id);

                            return { ...categoryConfig!, order };
                        });
                    } else {
                        queryClient.setQueryData<IMongoCategoryOrderConfig>(
                            'getCategoryOrder',
                            (await getConfigByTypeRequest(ConfigTypes.CATEGORY_ORDER)) as IMongoCategoryOrderConfig,
                        );
                    }
                }

                const updatedUserPermissions = updateUserPermissionForCategory(data, currentUser, currentWorkspace._id);
                setUser(updatedUserPermissions);
                toast.success(i18next.t(isEditMode ? 'wizard.category.editedSuccessfully' : 'wizard.category.createdSuccessfully'));
                handleClose();
            },
            onError: (error: AxiosError) => {
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
