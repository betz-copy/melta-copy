import React from 'react';
import { Box, StepLabel, Stepper, Step, Grid } from '@mui/material';
import i18next from 'i18next';
import { FormikProps } from 'formik';
import { pickBy } from 'lodash';
import GeneralDetails from './GeneralDetails';
import StepsReviewers from './StepsReviewers';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { IMongoProcessInstancePopulated, IReferencedEntityForProcess, StepsObjectPopulated } from '../../../../interfaces/processes/processInstance';
import { getAllFieldsTouched } from '../../../../utils/processWizard/formik';

export interface ProcessDetailsValues {
    template: IMongoProcessTemplatePopulated | null;
    name: string;
    startDate: Date | null;
    endDate: Date | null;
    details: object;
    detailsAttachments: object;
    entityReferences: Record<string, IReferencedEntityForProcess | string>;
    steps: StepsObjectPopulated;
}

interface IStepProps {
    onNext: () => void;
    onBack: () => void;
}

export interface IDetailsStepProp extends IStepProps {
    detailsFormikData: FormikProps<ProcessDetailsValues>;
    isEditMode: boolean | undefined;
    processInstance: IMongoProcessInstancePopulated | undefined;
}

interface RenderFormStepProps extends IDetailsStepProp {
    step: {
        label: string;
        component: React.FC<IDetailsStepProp>;
    };
}

interface ProcessDetailsProps {
    detailsFormikData: FormikProps<ProcessDetailsValues>;
    isEditMode?: boolean;
    processInstance?: IMongoProcessInstancePopulated;
}

const steps = [
    {
        label: i18next.t('wizard.processInstance.generalDetails'),
        component: GeneralDetails,
    },
    {
        label: i18next.t('wizard.processInstance.stepsReviewers'),
        component: StepsReviewers,
    },
];

const RenderFormStep: React.FC<RenderFormStepProps> = ({ step, ...props }) => {
    const Component = step.component;
    return <Component {...props} />;
};

const ProcessDetails: React.FC<ProcessDetailsProps> = ({ detailsFormikData, isEditMode, processInstance }) => {
    const [activeProcessDetailsStep, setActiveProcessDetailsStep] = React.useState(0);

    const handleNext = () => {
        const currentTouched: Record<string, any> = getAllFieldsTouched(detailsFormikData.values);

        const templateFileProperties = detailsFormikData.values.template
            ? pickBy(detailsFormikData.values.template.details.properties.properties, (value) => value.format === 'fileId')
            : undefined;

        const templateEntityReferenceProperties = detailsFormikData.values.template
            ? pickBy(detailsFormikData.values.template.details.properties.properties, (value) => value.format === 'entityReference')
            : undefined;

        const detailsAttachments = {};
        Object.keys(templateFileProperties!).forEach((fileField) => {
            detailsAttachments[fileField] = true;
        });
        currentTouched.detailsAttachments = detailsAttachments;

        const entityReferences = {};
        Object.keys(templateEntityReferenceProperties!).forEach((entityField) => {
            entityReferences[entityField] = true;
        });
        currentTouched.entityReferences = entityReferences;

        detailsFormikData.setTouched(currentTouched);

        if (detailsFormikData.isValid) setActiveProcessDetailsStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveProcessDetailsStep((prevActiveStep) => prevActiveStep - 1);
    };

    return (
        <Box
            sx={{
                paddingRight: 3,
                paddingLeft: 3,
                width: 1,
                height: 1,
            }}
        >
            <Grid container direction="column">
                <Grid item>
                    <Box sx={{ width: '100%', paddingBottom: 5, paddingTop: 1 }}>
                        <Stepper nonLinear activeStep={activeProcessDetailsStep}>
                            {steps.map(({ label }) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                </Grid>
                <Grid item>
                    <RenderFormStep
                        step={steps[activeProcessDetailsStep]}
                        detailsFormikData={detailsFormikData}
                        onNext={handleNext}
                        onBack={handleBack}
                        isEditMode={isEditMode}
                        processInstance={processInstance}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProcessDetails;
