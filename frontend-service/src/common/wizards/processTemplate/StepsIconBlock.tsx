import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { AccordionDetails, AccordionSummary, Grid, Typography } from '@mui/material';
import { FormikErrors } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { FieldBlockAccordion } from '../entityTemplate/fieldBlock/styles';
import { ProcessTemplateWizardValues } from '.';
import { ChooseStepsIcon } from './ChooseStepIcon';
import { StepsGenericBlockProps } from './StepsBlocksInterface';

const StepsIconBlock: React.FC<StepsGenericBlockProps> = ({ title, values, setFieldValue, propIndex, errors, touched }) => {
    const errorsOfStep = errors.steps?.[propIndex] as FormikErrors<ProcessTemplateWizardValues['steps'][number]> | undefined;
    return (
        <FieldBlockAccordion style={{ border: errorsOfStep?.icon && touched && '1px solid red' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                {errorsOfStep?.icon && <div style={{ color: 'error', justifyContent: 'center' }}>{i18next.t('validation.iconRequired')}</div>}
                <Grid container direction="column" alignItems="center">
                    <ChooseStepsIcon icon={values.steps[propIndex].icon} index={propIndex} setFieldValue={setFieldValue} key={propIndex} />
                </Grid>
            </AccordionDetails>
        </FieldBlockAccordion>
    );
};

export default StepsIconBlock;
