import React from 'react';
import { TextField, Box, MenuItem, Button } from '@mui/material';
import { FieldArray, getIn } from 'formik';
import * as Yup from 'yup';

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
                    name: Yup.string().required('חובה'),
                    title: Yup.string().required('חובה'),
                    type: Yup.string().oneOf(validPropertyTypes, 'סוג שדה לא תקין').required('חובה'),
                }),
            )
            .required('חובה'),
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
                                        label="prop name"
                                        name={name}
                                        value={p.name}
                                        onChange={handleChange}
                                        error={touchedName && Boolean(errorName)}
                                        helperText={touchedName && errorName}
                                    />
                                </Box>
                                <Box margin={1}>
                                    <TextField
                                        label="prop display name"
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
                                        label="type"
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
                                <Button type="button" color="secondary" variant="outlined" onClick={() => remove(index)}>
                                    x
                                </Button>
                            </div>
                        );
                    })}
                    <Button type="button" variant="outlined" onClick={() => push({ id: Math.random(), name: '', title: '', type: '' })}>
                        Add
                    </Button>
                </>
            )}
        </FieldArray>
    );
};

export { AddFields, addFieldsSchema };
