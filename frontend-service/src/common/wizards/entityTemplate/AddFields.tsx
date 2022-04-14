/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import { TextField, Box, MenuItem, Button, Grid, Card, CardContent, Switch, FormControlLabel, IconButton } from '@mui/material';
import { FieldArray, getIn } from 'formik';
import * as Yup from 'yup';
import i18next from 'i18next';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { englishValidation } from '../../../utils/validation';
import { EntityTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';

const basePropertyTypes = ['string', 'number', 'boolean'];
const stringTypes = ['date', 'date-time', 'email'];
const validPropertyTypes = [...basePropertyTypes, ...stringTypes];

const addFieldsSchema = {
    properties: Yup.array()
        .of(
            Yup.object({
                name: Yup.string().matches(englishValidation, i18next.t('validation.english')).required(i18next.t('validation.required')),
                title: Yup.string().required(i18next.t('validation.required')),
                type: Yup.string().oneOf(validPropertyTypes, i18next.t('validation.invalidPropertyType')).required(i18next.t('validation.required')),
                required: Yup.boolean().required(i18next.t('validation.required')),
            }),
        )
        .min(1, i18next.t('validation.oneField'))
        .required(i18next.t('validation.required')),
};

const AddFields: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, touched, errors, handleChange }) => {
    return (
        <FieldArray name="properties">
            {({ push, remove }) => (
                <>
                    <Grid container maxWidth="950px" spacing={2}>
                        {values.properties.map((p, index) => {
                            const name = `properties[${index}].name`;
                            const touchedName = getIn(touched, name);
                            const errorName = getIn(errors, name);

                            const title = `properties[${index}].title`;
                            const touchedTitle = getIn(touched, title);
                            const errorTitle = getIn(errors, title);

                            const type = `properties[${index}].type`;
                            const touchedType = getIn(touched, type);
                            const errorType = getIn(errors, type);

                            const required = `properties[${index}].required`;

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
                                                    label={i18next.t('wizard.entityTemplate.propertyName')}
                                                    name={name}
                                                    value={p.name}
                                                    onChange={handleChange}
                                                    error={touchedName && Boolean(errorName)}
                                                    helperText={touchedName && errorName}
                                                />
                                            </Box>
                                            <Box margin={1}>
                                                <TextField
                                                    label={i18next.t('wizard.entityTemplate.propertyDisplayName')}
                                                    name={title}
                                                    value={p.title}
                                                    onChange={handleChange}
                                                    error={touchedTitle && Boolean(errorTitle)}
                                                    helperText={touchedTitle && errorTitle}
                                                />
                                            </Box>
                                            <Box margin={1}>
                                                <TextField
                                                    select
                                                    fullWidth
                                                    type="text"
                                                    label={i18next.t('wizard.entityTemplate.propertyType')}
                                                    name={type}
                                                    value={p.type}
                                                    onChange={handleChange}
                                                    error={touchedType && Boolean(errorType)}
                                                    helperText={touchedType && errorType}
                                                >
                                                    {validPropertyTypes.map((validType) => (
                                                        <MenuItem key={validType} value={validType}>
                                                            {validType}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                    <Button type="button" variant="contained" style={{ margin: '8px' }} onClick={() => push({ name: '', title: '', type: '' })}>
                        {i18next.t('wizard.entityTemplate.addProperty')}
                    </Button>

                    {errors.properties === i18next.t('validation.oneField') && (
                        <div style={{ color: '#d32f2f' }}>{i18next.t('validation.oneField')}</div>
                    )}
                </>
            )}
        </FieldArray>
    );
};

export { AddFields, addFieldsSchema };
