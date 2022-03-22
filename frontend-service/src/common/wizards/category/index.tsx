import React from 'react';

import { toast } from 'react-toastify';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { CreateCategoryName, createCategoryNameSchema } from './CreateCategoryName';
import { createCategoryRequest } from '../../../services/categoriesService';
import { ICategory, IMongoCategory } from '../../../interfaces/categories';

export interface CategoryWizardValues extends Omit<ICategory, 'iconFileId'> {
    file?: Partial<File>;
}
const steps: StepsType<CategoryWizardValues> = [
    {
        label: i18next.t('wizard.chooseCategoryName'),
        component: (props) => <CreateCategoryName {...props} />,
        validation: createCategoryNameSchema,
    },
];

const CategoryWizard: React.FC<WizardBaseType<CategoryWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', displayName: '', file: undefined },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const { isLoading, mutateAsync } = useMutation((category: CategoryWizardValues) => createCategoryRequest(category), {
        onSuccess: (data) => {
            queryClient.setQueryData<IMongoCategory[]>('getCategories', (prevData: IMongoCategory[] | undefined) => {
                return [...(prevData || []), data];
            });
            toast.success('created category successfully');
        },
        onError: () => {
            toast.error('failed to create category');
        },
    });

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title={i18next.t('wizard.createCategory')}
            steps={steps}
            isLoading={isLoading}
            submitFucntion={(values) => mutateAsync(values)}
        />
    );
};

export { CategoryWizard };
