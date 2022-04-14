import React from 'react';
import * as Yup from 'yup';
import { FieldArray, getIn } from 'formik';
import { Box, Button, Grid, TextField, Card, CardContent, IconButton, FormControlLabel, Switch } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { StepComponentProps } from '../index';
import { EntityTemplateWizardValues } from './index';
import { englishValidation, hebrewValidation } from '../../../utils/validation';

const attachmentsFieldSchema = {
    attachmentProperties: Yup.array().of(
        Yup.object({
            name: Yup.string().matches(englishValidation, i18next.t('validation.english')).required(i18next.t('validation.required')),
            title: Yup.string().matches(hebrewValidation, i18next.t('validation.hebrew')).required(i18next.t('validation.required')),
            required: Yup.boolean().required(i18next.t('validation.required')),
        }),
    ),
};

const AttachmentsField: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, touched, errors, handleChange }) => {
    return (
        <FieldArray name="attachmentProperties">
            {({ push, remove }) => (
                <>
                    <Grid container maxWidth="600px">
                        {values.attachmentProperties.map((p, index) => {
                            const name = `attachmentProperties[${index}].name`;
                            const touchedName = getIn(touched, name);
                            const errorName = getIn(errors, name);

                            const title = `attachmentProperties[${index}].title`;
                            const touchedTitle = getIn(touched, title);
                            const errorTitle = getIn(errors, title);

                            const required = `attachmentProperties[${index}].required`;

                            return (
                                <Grid item key={name}>
                                    <Card>
                                        <CardContent>
                                            <Grid container margin={1} justifyContent="space-between">
                                                <FormControlLabel
                                                    control={<Switch onChange={handleChange} name={required} />}
                                                    label={i18next.t('validation.required') as string}
                                                />
                                                <IconButton onClick={() => remove(index)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Grid>
                                            <Box margin={1}>
                                                <TextField
                                                    label={i18next.t('wizard.entityTemplate.attachmentName')}
                                                    name={name}
                                                    value={p.name}
                                                    onChange={handleChange}
                                                    error={touchedName && Boolean(errorName)}
                                                    helperText={touchedName && errorName}
                                                />
                                            </Box>
                                            <Box margin={1}>
                                                <TextField
                                                    label={i18next.t('wizard.entityTemplate.attachmentDisplayName')}
                                                    name={title}
                                                    value={p.title}
                                                    onChange={handleChange}
                                                    error={touchedTitle && Boolean(errorTitle)}
                                                    helperText={touchedTitle && errorTitle}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                    <Button type="button" variant="contained" style={{ margin: '8px' }} onClick={() => push({ name: '', title: '', type: 'file' })}>
                        {i18next.t('wizard.entityTemplate.addAttachment')}
                    </Button>
                </>
            )}
        </FieldArray>
    );
};

export { AttachmentsField, attachmentsFieldSchema };
