import React, { useEffect } from 'react';

import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import i18next from 'i18next';
import { useMutation, useQueryClient } from 'react-query';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { CreateCategoryName, createCategoryNameSchema } from './CreateCategoryName';
import { addCategory, updateCategory } from '../../../store/globalState';
import { createCategoryRequest } from '../../../services/categoriesService';
import { ICategory } from '../../../interfaces/categories';

export type { ICategory as CategoryWizardValues };

const steps: StepsType<ICategory> = [
    {
        label: i18next.t('wizard.chooseCategoryName'),
        component: (props) => <CreateCategoryName {...props} />,
        validation: createCategoryNameSchema,
    },
];

const CategoryWizard: React.FC<WizardBaseType<ICategory>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', displayName: '' },
    isEditMode = false,
}) => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { isLoading, error, data, mutateAsync } = useMutation((category: ICategory) => createCategoryRequest(category), {
        onSuccess: () => {
            queryClient.invalidateQueries('getCategories');
        },
    });

    useEffect(() => {
        if (error) {
            toast.error('failed to create category');
        }
    }, [error]);

    useEffect(() => {
        if (data) {
            if (isEditMode) {
                toast.success('updated category successfully');
                dispatch(updateCategory(data));
            } else {
                toast.success('created category successfully');
                dispatch(addCategory(data));
            }
            handleClose();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, dispatch]); // removed isEditMode, handleClose because of race-condition with close

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
