import React, { useEffect } from 'react';

import { toast } from 'react-toastify';
import { StepsType, Wizard } from '../index';
import { environment } from '../../../globals';
import { CreateCategoryName, createCategoryNameSchema } from './CreateCategoryName';
import { useAxios } from '../../../axios';
import { ICategory as CategoryWizardValues } from '../../../interfaces';

export type { CategoryWizardValues };

const steps: StepsType<CategoryWizardValues> = [
    {
        label: 'בחר שם קטגוריה',
        component: (props) => <CreateCategoryName {...props} />,
        validation: createCategoryNameSchema,
    },
];

const CategoryWizard: React.FC<{ open: boolean; handleClose: () => void; initalStep?: number; initialValues?: CategoryWizardValues }> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', displayName: '' },
}) => {
    const [{ loading, error, data }, executeRequest] = useAxios({ method: 'POST', url: environment.api.categories }, { manual: true });

    useEffect(() => {
        if (error) {
            toast.error('failed to create category');
        }
    }, [error]);

    useEffect(() => {
        if (data) {
            toast.success('created category successfully');
        }
    }, [data]);

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            title="יצירת קטגוריה"
            steps={steps}
            submitOptions={{
                func: (values: CategoryWizardValues) => executeRequest({ data: values }),
                loading,
            }}
        />
    );
};

export { CategoryWizard };
