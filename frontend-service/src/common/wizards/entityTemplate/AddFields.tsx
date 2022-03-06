import React from 'react';
import { TextField, Box, MenuItem, Button, Grid } from '@mui/material';
import { FieldArray, getIn } from 'formik';
import * as Yup from 'yup';

import i18next from 'i18next';
import { EntityTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';

const basePropertyTypes = ['string', 'number', 'boolean'];
const stringTypes = ['date', 'time', 'date-time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri'];
const validPropertyTypes = [...basePropertyTypes, ...stringTypes];

const addFieldsSchema = (formValueName: 'requiredProrerites' | 'optionalProrerites') => {
    return {
        [formValueName]: Yup.array()
            .of(
                Yup.object({
                    name: Yup.string().required(i18next.t('validation.required')),
                    title: Yup.string().required(i18next.t('validation.required')),
                    type: Yup.string().oneOf(validPropertyTypes, 'סוג שדה לא תקין').required(i18next.t('validation.required')),
                }),
            )
            .required(i18next.t('validation.required')),
    };
};

const AddFields: React.FC<StepComponentProps<EntityTemplateWizardValues> & { formValueName: 'requiredProrerites' | 'optionalProrerites' }> = ({
    formValueName,
    values,
    touched,
    errors,
    handleChange,
}) => {
    return (
        <FieldArray name={formValueName}>
            {({ push, remove }) => (
                <>
                    <Grid container maxWidth="600px">
                        {values[formValueName].map((p, index) => {
                            const name = `${formValueName}[${index}].name`;
                            const touchedName = getIn(touched, name);
                            const errorName = getIn(errors, name);

                            const title = `${formValueName}[${index}].title`;
                            const touchedTitle = getIn(touched, title);
                            const errorTitle = getIn(errors, title);

                            const type = `${formValueName}[${index}].type`;
                            const touchedType = getIn(touched, type);
                            const errorType = getIn(errors, type);

                            return (
                                <div key={name}>
                                    <Box margin={1}>
                                        <TextField
                                            label={i18next.t('wizard.propertyName')}
                                            name={name}
                                            value={p.name}
                                            onChange={handleChange}
                                            error={touchedName && Boolean(errorName)}
                                            helperText={touchedName && errorName}
                                        />
                                    </Box>
                                    <Box margin={1}>
                                        <TextField
                                            label={i18next.t('wizard.propertyDisplayName')}
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
                                            type="text"
                                            label={i18next.t('wizard.propertyType')}
                                            name={type}
                                            value={p.type}
                                            onChange={handleChange}
                                            error={touchedType && Boolean(errorType)}
                                            helperText={touchedType && errorType}
                                            sx={{ width: 223 }}
                                        >
                                            {validPropertyTypes.map((validType) => (
                                                <MenuItem key={validType} value={validType}>
                                                    {validType}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Box>
                                    <Button
                                        type="button"
                                        color="secondary"
                                        variant="outlined"
                                        onClick={() => remove(index)}
                                        style={{ margin: '8px' }}
                                    >
                                        x
                                    </Button>
                                </div>
                            );
                        })}
                    </Grid>
                    <Button type="button" variant="contained" style={{ margin: '8px' }} onClick={() => push({ name: '', title: '', type: '' })}>
                        {i18next.t('wizard.addProperty')}
                    </Button>
                </>
            )}
        </FieldArray>
    );
};

export { AddFields, addFieldsSchema };
