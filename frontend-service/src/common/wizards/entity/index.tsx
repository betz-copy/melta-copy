import React, { useEffect } from 'react';

import { toast } from 'react-toastify';
import { StepsType, Wizard } from '../index';
import { environment } from '../../../globals';
import { useAxios } from '../../../axios';
import { ChooseTemplate, chooseTemplateSchema } from './ChooseTemplate';
import { FillFields, fillFieldsSchema } from './FillFields';

export interface EntityWizardValues {
    template: {
        _id: string;
        displayName: string;
        properties: object;
    };
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

const EntityWizard: React.FC<{ open: boolean; handleClose: () => void; initalStep?: number; initialValues?: EntityWizardValues }> = ({
    open,
    handleClose,
    initalStep = 0,
    initialValues = {
        template: {
            _id: '',
            displayName: '',
            properties: {},
        },
        properties: {},
    },
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
            title="יצירת יישות"
            steps={steps}
            submitOptions={{
                func: (values: EntityWizardValues) => executeRequest({ data: values }),
                loading,
            }}
        />
    );
};

export { EntityWizard };
