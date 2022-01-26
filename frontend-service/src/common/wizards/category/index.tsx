import React, { useEffect } from 'react';

import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { environment } from '../../../globals';
import { CreateCategoryName, createCategoryNameSchema } from './CreateCategoryName';
import { useAxios } from '../../../axios';
import { ICategory as CategoryWizardValues, IMongoCategory } from '../../../interfaces';
import { addCategory, updateCategory } from '../../../store/globalState';

export type { CategoryWizardValues };

const steps: StepsType<CategoryWizardValues> = [
    {
        label: 'בחר שם קטגוריה',
        component: (props) => <CreateCategoryName {...props} />,
        validation: createCategoryNameSchema,
    },
];

const CategoryWizard: React.FC<WizardBaseType<CategoryWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', displayName: '' },
    isEditMode = false,
}) => {
    const [{ loading, error, data }, executeRequest] = useAxios<IMongoCategory>(
        isEditMode
            ? { method: 'PUT', url: `${environment.api.categories}/${(initialValues as IMongoCategory)._id}` }
            : { method: 'POST', url: environment.api.categories },
        { manual: true },
    );
    const dispatch = useDispatch();

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
            title="יצירת קטגוריה"
            steps={steps}
            isLoading={loading}
            submitFucntion={(values) => executeRequest({ data: values })}
        />
    );
};

export { CategoryWizard };
