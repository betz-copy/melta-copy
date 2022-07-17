import React from 'react';

import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { AxiosError } from 'axios';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { CreateCategoryName, createCategoryNameSchema } from './CreateCategoryName';
import { createCategoryRequest, updateCategoryRequest } from '../../../services/templates/categoriesService';
import { ICategory, IMongoCategory } from '../../../interfaces/categories';
import { replaceItemById } from '../../../utils/reactQuery';
import { ChooseIcon } from './ChooseIcon';
import { ChooseColor } from './ChooseColor';
import fileDetails from '../../../interfaces/fileDetails';
import { ErrorToast } from '../../ErrorToast';

export interface CategoryWizardValues extends Omit<ICategory, 'iconFileId'> {
    icon?: fileDetails;
}
const steps: StepsType<CategoryWizardValues> = [
    {
        label: i18next.t('wizard.category.chooseName'),
        component: (props) => <CreateCategoryName {...props} />,
        validationSchema: createCategoryNameSchema,
    },
    {
        label: i18next.t('wizard.category.chooseIcon'),
        component: (props) => <ChooseIcon {...props} />,
    },
    {
        label: i18next.t('wizard.category.chooseColor'),
        component: (props) => <ChooseColor {...props} />,
    },
];

const CategoryWizard: React.FC<WizardBaseType<CategoryWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', displayName: '', icon: undefined, color: '#ffffff' },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation(
        (category: CategoryWizardValues) =>
            isEditMode === true
                ? updateCategoryRequest((initialValues as CategoryWizardValues & { _id: string })._id, category)
                : createCategoryRequest(category),
        {
            onSuccess: (data) => {
                if (isEditMode) {
                    queryClient.setQueryData<IMongoCategory[]>('getCategories', (prevData) => replaceItemById(data, prevData));
                    toast.success(i18next.t('wizard.category.editedSuccefully'));
                } else {
                    queryClient.setQueryData<IMongoCategory[]>('getCategories', (prevData) => [...prevData!, data]);
                    toast.success(i18next.t('wizard.category.createdSuccessfully'));
                }
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

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.category.title')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync(values)}
        />
    );
};

export { CategoryWizard };
