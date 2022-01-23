/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import { Button, Box, TextField, MenuItem, FormControlLabel, Checkbox, Autocomplete, CircularProgress } from '@mui/material';
import { FieldArray, getIn, FormikProps } from 'formik';
import * as Yup from 'yup';

import { StepsType, Wizard } from '../../common/wizards/Wizard';
import { useAxios } from '../../axios';
import { environment } from '../../globals';

interface Values {
    name: string;
    displayName: string;
    category: {
        _id: string;
        name: string;
        displayName: string;
    };
    properties: { name: string; displayName: string; type: string; isRequired: boolean }[];
}

const basePropertyTypes = ['string', 'number', 'boolean'];
const stringTypes = ['date', 'time', 'date-time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri'];
const validPropertyTypes = [...basePropertyTypes, ...stringTypes];

const steps: StepsType<Values> = [
    {
        label: 'בחר קטגוריה',
        component: ({ values, touched, errors, setFieldValue }: FormikProps<Values>) => {
            const [{ data: categories, loading: categoriesLoading }] = useAxios(environment.api.categories); // TODO: error handling

            return (
                <Autocomplete
                    id="category"
                    options={(categories || []) as { displayName: string }[]}
                    onChange={(e, value) => setFieldValue('category', value || '')}
                    loading={categoriesLoading}
                    value={values.category._id ? values.category : null}
                    getOptionLabel={(option) => option.displayName}
                    renderInput={(params) => (
                        <TextField
                            // eslint-disable-next-line react/jsx-props-no-spreading
                            {...params}
                            error={Boolean(touched.category && errors.category)}
                            fullWidth
                            helperText={touched.category && errors.category}
                            name="category"
                            variant="outlined"
                            label="category"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {categoriesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />
            );
        },
        validation: {
            category: Yup.object({
                _id: Yup.string().required(),
                name: Yup.string().required(),
                displayName: Yup.string().required(),
            }).required('חובה'),
        },
    },
    {
        label: 'בחר שם תבנית',
        component: ({ values, touched, errors, handleChange }: FormikProps<Values>) => (
            <>
                <Box margin={1}>
                    <TextField
                        name="name"
                        label="name"
                        value={values.name}
                        onChange={handleChange}
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                    />
                </Box>
                <Box margin={1}>
                    <TextField
                        name="displayName"
                        label="displayName"
                        value={values.displayName}
                        onChange={handleChange}
                        error={touched.displayName && Boolean(errors.displayName)}
                        helperText={touched.displayName && errors.displayName}
                    />
                </Box>
            </>
        ),
        validation: {
            name: Yup.string().required('חובה'),
            displayName: Yup.string().required('חובה'),
        },
    },
    {
        label: 'שדות',
        component: ({ values, touched, errors, handleChange }: FormikProps<Values>) => (
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
                                // eslint-disable-next-line react/no-array-index-key
                                <div key={index}>
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
        ),
        validation: {
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
        },
    },
];

const Page = () => {
    return (
        <Wizard
            open
            handleClose={() => {}}
            initialValues={{ name: '', displayName: '', category: { displayName: '', name: '', _id: '' }, properties: [] }}
            title="יצירת תבנית"
            steps={steps}
            submitOptions={{
                method: 'POST',
                url: environment.api.entityTemplates,
                bodyFormatter: (values) => values,
            }}
        />
    );
};

export { Page };
