import React from 'react';
import { Box, StepLabel, Stepper, Step, Grid } from '@mui/material';
import i18next from 'i18next';
import GeneralDetails from './GeneralDetails';
import StepsReviewers from './StepsReviewers';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';
import { IMongoProcessInstancePopulated, StepsObjectPopulated } from '../../../../interfaces/processes/processInstance';
import { FormikProps } from 'formik/dist/types';
import { getAllFieldsTouched } from '../../../../utils/processWizard/formik';

export interface ProcessDetailsValues {
    template: IMongoProcessTemplatePopulated | null;
    name: string;
    startDate: Date | null;
    endDate: Date | null;
    details: object;
    detailsAttachments: object;
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
        detailsFormikData.setTouched(getAllFieldsTouched(detailsFormikData.values));
        if (detailsFormikData.isValid) setActiveProcessDetailsStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveProcessDetailsStep((prevActiveStep) => prevActiveStep - 1);
    };

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                overflow: 'auto',
                paddingRight: '30px',
            }}
        >
            <Grid container direction="column">
                <Grid item>
                    <Box sx={{ width: '100%', margin: '20px, 0, 0, 30px', paddingBottom: 5, paddingTop: 1 }}>
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
