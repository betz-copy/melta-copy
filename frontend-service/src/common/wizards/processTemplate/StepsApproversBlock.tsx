/* eslint-disable react/no-array-index-key */
import React from 'react';
import { AccordionDetails, AccordionSummary, Box, Grid, Typography } from '@mui/material';
import { FieldArray, FormikErrors } from 'formik';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import _debounce from 'lodash.debounce';
import i18next from 'i18next';
import UserAutocomplete from '../../inputs/UserAutocomplete';
import CreateUserCard from './ApproverCard';
import { StepsGenericBlockProps } from './StepsBlocksInterface';
import { FieldBlockAccordion } from '../entityTemplate/FieldBlock';
import { ProcessTemplateWizardValues } from '.';
import { useDarkModeStore } from '../../../stores/darkMode';

const StepsApproversBlock: React.FC<StepsGenericBlockProps> = ({ title, values, propIndex, errors, touched }) => {
    const errorsOfStep = errors.steps?.[propIndex] as FormikErrors<ProcessTemplateWizardValues['steps'][number]> | undefined;

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const [userInputValue, setUserInputValue] = React.useState('');

    return (
        <Grid>
            <FieldBlockAccordion style={{ border: errorsOfStep?.reviewers && touched && '1px solid red' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FieldArray name={`steps[${propIndex}].reviewers`}>
                        {({ push, remove }) => (
                            <Box sx={{ bgcolor: darkMode ? '#242424' : 'white' }}>
                                <Grid marginBottom={2}>
                                    <UserAutocomplete
                                        value={null}
                                        onChange={(_e, chosenUser, reason) => {
                                            if (reason !== 'selectOption' || !chosenUser) return;
                                            push({ ...chosenUser });
                                            setUserInputValue('');
                                        }}
                                        isError={false}
                                        displayValue={userInputValue}
                                        onDisplayValueChange={(_, newDisplayValue) => setUserInputValue(newDisplayValue)}
                                    />
                                </Grid>
                                <Grid container spacing={1}>
                                    {values.steps[propIndex].reviewers.map((user, index) => (
                                        <CreateUserCard key={user._id} userName={user.displayName} userIndex={index} remove={() => remove(index)} />
                                    ))}
                                </Grid>
                                {errorsOfStep?.reviewers === i18next.t('validation.oneField') && (
                                    <div style={{ color: '#d32f2f', alignItems: 'center', justifyContent: 'center' }}>
                                        {i18next.t('validation.oneStepApprover')}
                                    </div>
                                )}
                            </Box>
                        )}
                    </FieldArray>
                </AccordionDetails>
            </FieldBlockAccordion>
        </Grid>
    );
};
export default StepsApproversBlock;
