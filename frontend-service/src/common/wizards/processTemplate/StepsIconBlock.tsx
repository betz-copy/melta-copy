/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AccordionDetails, AccordionSummary, Grid, Typography } from '@mui/material';
import _debounce from 'lodash.debounce';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { FormikErrors } from 'formik';
import { ProcessTemplateWizardValues } from '.';
import { ChooseStepsIcon } from './ChooseStepIcon';
import { StepsGenericBlockProps } from './StepsBlocksInterface';
import { FieldBlockAccordion } from '../entityTemplate/fieldBlock/interfaces';

const StepsIconBlock: React.FC<StepsGenericBlockProps> = ({ title, values, setFieldValue, propIndex, errors, touched }) => {
    const errorsOfStep = errors.steps?.[propIndex] as FormikErrors<ProcessTemplateWizardValues['steps'][number]> | undefined;
    return (
        <FieldBlockAccordion style={{ border: errorsOfStep?.icon && touched && '1px solid red' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                {errorsOfStep?.icon && <div style={{ color: '#d32f2f', justifyContent: 'center' }}>{i18next.t('validation.iconRequired')}</div>}
                <Grid container direction="column" alignItems="center">
                    <ChooseStepsIcon icon={values.steps[propIndex].icon} index={propIndex} setFieldValue={setFieldValue} key={propIndex} />
                </Grid>
            </AccordionDetails>
        </FieldBlockAccordion>
    );
};

export default StepsIconBlock;
