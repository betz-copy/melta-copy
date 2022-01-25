import React from 'react';
import { TextField, Box, MenuItem, FormControlLabel, Checkbox, Button } from '@mui/material';
import { FieldArray, getIn } from 'formik';
import * as Yup from 'yup';

import { EntityTemplateWizardValues } from './index';
import { StepComponentProps } from '../index';

const basePropertyTypes = ['string', 'number', 'boolean'];
const stringTypes = ['date', 'time', 'date-time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri'];
const validPropertyTypes = [...basePropertyTypes, ...stringTypes];

const addFieldsSchema = {
    properties: Yup.array()
        .of(
            Yup.object({
                name: Yup.string().required('חובה'),
                displayName: Yup.string().required('חובה'),
                type: Yup.string().oneOf(validPropertyTypes, 'סוג שדה לא תקין').required('חובה'),
                isRequired: Yup.boolean(),
            }),
        )
        .required('חובה'),
};

const AddFields: React.FC<StepComponentProps<EntityTemplateWizardValues>> = ({ values, touched, errors, handleChange }) => {
    return (
        <FieldArray name="properties">
            {({ push, remove }) => (
                <>
                    {values.properties.map((p, index) => {
                        const name = `properties[${index}].name`;
                        const touchedName = getIn(touched, name);
                        const errorName = getIn(errors, name);

                        const displayName = `properties[${index}].displayName`;
                        const touchedDisplayName = getIn(touched, displayName);
                        const errorDisplayName = getIn(errors, displayName);

                        const type = `properties[${index}].type`;
                        const touchedType = getIn(touched, type);
                        const errorType = getIn(errors, type);

                        const isRequired = `properties[${index}].isRequired`;

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
                                        name={displayName}
                                        value={p.displayName}
                                        onChange={handleChange}
                                        error={touchedDisplayName && Boolean(errorDisplayName)}
                                        helperText={touchedDisplayName && errorDisplayName}
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
                                <Box margin={1}>
                                    <FormControlLabel
                                        control={<Checkbox name={isRequired} value={p.isRequired} onChange={handleChange} />}
                                        label="is required"
                                    />
                                </Box>
                                <Button type="button" color="secondary" variant="outlined" onClick={() => remove(index)}>
                                    x
                                </Button>
                            </div>
                        );
                    })}
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={() => push({ id: Math.random(), name: '', displayName: '', type: '', isRequired: false })}
                    >
                        Add
                    </Button>
                </>
            )}
        </FieldArray>
    );
};

export { AddFields, addFieldsSchema };
