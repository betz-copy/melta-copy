import React, { useEffect } from 'react';

import { toast } from 'react-toastify';
import { StepsType, Wizard } from '../index';
import { environment } from '../../../globals';
import { ChooseCategory, chooseCategorySchema } from './ChooseCategory';
import { CreateTemplateName, createTemplateNameSchema } from './CreateTemplateName';
import { AddFields, addFieldsSchema } from './AddFields';
import { useAxios } from '../../../axios';

export interface EntityTemplateWizardValues {
    name: string;
    displayName: string;
    category: {
        _id: string;
        name: string;
        displayName: string;
    };
    properties: { name: string; displayName: string; type: string; isRequired: boolean }[];
}

const steps: StepsType<EntityTemplateWizardValues> = [
    {
        label: 'בחר קטגוריה',
        component: (props) => <ChooseCategory {...props} />,
        validation: chooseCategorySchema,
    },
    {
        label: 'בחר שם תבנית',
        component: (props) => <CreateTemplateName {...props} />,
        validation: createTemplateNameSchema,
    },
    {
        label: 'שדות',
        component: (props) => <AddFields {...props} />,
        validation: addFieldsSchema,
    },
];

const EntityTemplateWizard: React.FC<{ open: boolean; handleClose: () => void; initalStep?: number; initialValues?: EntityTemplateWizardValues }> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = { name: '', displayName: '', category: { displayName: '', name: '', _id: '' }, properties: [] },
}) => {
    const [{ loading, error, data }, executeRequest] = useAxios({ method: 'POST', url: environment.api.entityTemplates }, { manual: true });

    useEffect(() => {
        if (error) {
            toast.error('failed to create template');
        }
    }, [error]);

    useEffect(() => {
        if (data) {
            toast.success('created template successfully');
        }
    }, [data]);

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            title="יצירת תבנית יישות"
            steps={steps}
            submitOptions={{
                func: (values: EntityTemplateWizardValues) => executeRequest({ data: values }),
                loading,
            }}
        />
    );
};

export { EntityTemplateWizard };
