/* eslint-disable react/no-array-index-key */
import React, { useState } from 'react';
import { AccordionDetails, AccordionSummary, Box, FormControlLabel, Grid, Switch, Typography } from '@mui/material';
import { FieldArray, FormikErrors } from 'formik';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import _debounce from 'lodash.debounce';
import i18next from 'i18next';
import UserAutocomplete from '../../inputs/UserAutocomplete';
import CreateUserCard from './ApproverCard';
import { StepsGenericBlockProps } from './StepsBlocksInterface';
import { ProcessTemplateWizardValues } from '.';
import { useDarkModeStore } from '../../../stores/darkMode';
import { FieldBlockAccordion } from '../entityTemplate/fieldBlock/interfaces';

const StepsApproversBlock: React.FC<
    StepsGenericBlockProps & {
        disableAddingReviewersFieldName: string;
        isDisableAddingReviewers: boolean;
    }
> = ({ title, values, propIndex, errors, touched, setFieldValue, disableAddingReviewersFieldName, isDisableAddingReviewers }) => {
    const errorsOfStep = errors.steps?.[propIndex] as FormikErrors<ProcessTemplateWizardValues['steps'][number]> | undefined;

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const [userInputValue, setUserInputValue] = useState('');

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
                                        mode="internal"
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
                                        <CreateUserCard key={user._id} user={user} userIndex={index} remove={() => remove(index)} />
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

                    <FormControlLabel
                        control={
                            <Switch
                                id="disableAddApprovers"
                                name="disableAddApprovers"
                                onChange={(_e, checked) => {
                                    setFieldValue(disableAddingReviewersFieldName, checked);
                                }}
                                checked={isDisableAddingReviewers}
                            />
                        }
                        label={i18next.t('wizard.processTemplate.blockAddingApprovers')}
                    />
                </AccordionDetails>
            </FieldBlockAccordion>
        </Grid>
    );
};
export default StepsApproversBlock;
