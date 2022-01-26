import React, { useEffect } from 'react';

import { toast } from 'react-toastify';
import { StepsType, Wizard, WizardBaseType } from '../index';
import { environment } from '../../../globals';
import { useAxios } from '../../../axios';
import { ChooseTemplate, chooseTemplateSchema } from './ChooseTemplate';
import { FillFields, fillFieldsSchema } from './FillFields';
import { IMongoEntityTemplate } from '../../../interfaces';

export interface EntityWizardValues {
    template: IMongoEntityTemplate;
    properties: object;
}

const steps: StepsType<EntityWizardValues> = [
    {
        label: 'בחר תבנית',
        component: (props) => <ChooseTemplate {...props} />,
        validation: chooseTemplateSchema,
    },
    {
        label: 'מלא פרטים',
        component: (props) => <FillFields {...props} />,
        validation: fillFieldsSchema,
    },
];

const EntityWizard: React.FC<WizardBaseType<EntityWizardValues>> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = {
        template: {
            _id: '',
            displayName: '',
            name: '',
            category: '',
            properties: {
                properties: {},
                required: [],
                type: 'object',
            },
        },
        properties: {},
    },
    isEditMode = false,
}) => {
    const [{ loading, error, data }, executeRequest] = useAxios({ method: 'POST', url: environment.api.entities }, { manual: true });

    useEffect(() => {
        if (error) {
            toast.error('failed to create entity instance');
        }
    }, [error]);

    useEffect(() => {
        if (data) {
            toast.success('created entity instance successfully');
        }
    }, [data]);

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            initialValues={initialValues}
            initalStep={initalStep}
            isEditMode={isEditMode}
            title="יצירת יישות"
            steps={steps}
            isLoading={loading}
            submitFucntion={(values) => executeRequest({ data: values })}
        />
    );
};

export { EntityWizard };
