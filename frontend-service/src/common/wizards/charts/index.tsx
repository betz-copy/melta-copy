import i18next from 'i18next';
import React from 'react';
import { useLocation } from 'wouter';
import { StepType, Wizard, WizardBaseType } from '..';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { CreateChartDetails, CreateChartDetailsSchema } from './CreateChartDetails';

export interface chartWizardValues {
    name: string;
    entityTemplate: IMongoEntityTemplatePopulated;
}

const defaultInitialValues: chartWizardValues = {
    name: '',
    entityTemplate: {
        _id: '',
        displayName: '',
        name: '',
        properties: {
            type: 'object',
            properties: {},
            required: [],
            hide: [],
        },
        category: { _id: '', displayName: '', name: '', color: '' },
        propertiesOrder: [],
        propertiesTypeOrder: ['properties', 'attachmentProperties'],
        propertiesPreview: [],
        uniqueConstraints: [],
        disabled: false,
    },
};

const steps: StepType<chartWizardValues>[] = [
    {
        label: i18next.t('wizard.iFrame.editDetails'),
        component: (props) => <CreateChartDetails {...props} />,
        validationSchema: CreateChartDetailsSchema,
    },
];

const ChartWizard: React.FC<WizardBaseType<chartWizardValues>> = ({
    open,
    handleClose,
    initialStep = 0,
    initialValues = { ...defaultInitialValues },
}) => {
    const [_, navigate] = useLocation();

    const submitFunction = async (values: chartWizardValues) => {
        navigate(`/charts/${values.entityTemplate._id}`, { state: values });
        return Promise.resolve();
    };

    return (
        <Wizard
            open={open}
            handleClose={handleClose}
            steps={steps}
            initialValues={initialValues}
            initialStep={initialStep}
            title="fff"
            submitFunction={submitFunction}
            isLoading={false}
        />
    );
};

export { ChartWizard };
