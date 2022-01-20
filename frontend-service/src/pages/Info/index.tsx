import React from 'react';
import { FieldArray, Formik, Form, getIn } from 'formik';
import { Button, MenuItem, TextField, Box, Divider, Checkbox, FormControlLabel } from '@mui/material';
import * as Yup from 'yup';

interface Values {
    name: string;
    displayName: string;
    category: string;
    properties: { name: string; displayName: string; type: string; isRequired: boolean }[];
}

const basePropertyTypes = ['string', 'number', 'boolean'];
const stringTypes = ['date', 'time', 'date-time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri'];
const validPropertyTypes = [...basePropertyTypes, ...stringTypes];

const hebrewRegex = /^[\u0590-\u05FF\s]+$/;
const validCategories = ['לוגיסטיקה', 'אנשים', 'טיסות'];

const Info = () => {
    const formToJSONSchema = (values: Values) => {
        const schema = {
            type: 'object',
            properties: {} as any,
            required: [] as string[],
        };

        const { properties } = values;

        properties.forEach(({ name, displayName, type, isRequired }) => {
            schema.properties[name] = {
                type: basePropertyTypes.includes(type) ? type : 'string',
                title: displayName,
                format: basePropertyTypes.includes(type) ? undefined : type,
            };

            if (isRequired) {
                schema.required.push(name);
            }
        });

        console.log(JSON.stringify(schema, null, 2));
    };

    return (
        <Formik
            initialValues={{
                name: '',
                displayName: '',
                category: '',
                properties: [] as Values['properties'],
            }}
            validationSchema={Yup.object({
                name: Yup.string().required('חובה'),
                displayName: Yup.string().matches(hebrewRegex, 'צריך להיות בעברית').required('חובה'),
                category: Yup.string().oneOf(validCategories, 'קטגוריה לא תקינה').required('חובה'),
                properties: Yup.array()
                    .of(
                        Yup.object({
                            name: Yup.string().required('חובה'),
                            displayName: Yup.string().matches(hebrewRegex, 'צריך להיות בעברית').required('חובה'),
                            type: Yup.string().oneOf(validPropertyTypes, 'סוג שדה לא תקין').required('חובה'),
                            isRequired: Yup.boolean(),
                        }),
                    )
                    .required('חובה'),
            })}
            onSubmit={(values: Values) => {
                console.log(JSON.stringify(values, null, 2));
                formToJSONSchema(values);
            }}
        >
            {({ values, touched, errors, handleChange }) => (
                <Form>
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
                    <Box margin={1}>
                        <TextField
                            sx={{ minWidth: 120 }}
                            select
                            type="text"
                            name="category"
                            label="category"
                            value={values.category}
                            onChange={handleChange}
                            error={touched.category && Boolean(errors.category)}
                            helperText={touched.category && errors.category}
                        >
                            {validCategories.map((category) => (
                                <MenuItem key={category} value={category}>
                                    {category}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>
                    <Divider />
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
                                                    sx={{ minWidth: 120 }}
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
                    <Button color="primary" variant="contained" fullWidth type="submit">
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export { Info };
