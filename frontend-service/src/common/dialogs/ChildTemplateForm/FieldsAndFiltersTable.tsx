import { FormikProps } from 'formik';
import React from 'react';
import { IChildTemplateForm } from '../../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { Divider, FormControlLabel, Grid } from '@mui/material';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';

interface IFieldsAndFiltersTableProps {
    formikProps: FormikProps<IChildTemplateForm>;
    entityTemplate: IMongoEntityTemplatePopulated;
}

const FieldsAndFiltersTable: React.FC<IFieldsAndFiltersTableProps> = ({ formikProps, entityTemplate }) => {
    const { values, setFieldValue } = formikProps;
    return (
        <>
            <Grid container>
                <Grid item xs={12}>
                    <Divider />
                </Grid>
            </Grid>
            <Grid container>
                {Object.entries(entityTemplate.properties.properties).map(([fieldName, property]) => {
                    const isRequired = entityTemplate.properties.required.includes(fieldName);
                    const value = values.properties.properties[fieldName] ?? {};
                    if (fieldName === 'text') console.log({ value });

                    return (
                        <React.Fragment key={fieldName}>
                            <Grid container alignItems="center" justifyContent="space-between" sx={{ py: 0.4, ml: 1 }}>
                                <Grid item xs={3}>
                                    <FormControlLabel
                                        control={
                                            <MeltaCheckbox
                                                checked={value.display}
                                                disabled={isRequired && value.defaultValue === undefined}
                                                onChange={(e) =>
                                                    setFieldValue(`properties.properties.${fieldName}`, {
                                                        ...value,
                                                        display: e.target.checked,
                                                        isEditableByUser: !e.target.checked ? false : value.isEditableByUser,
                                                    })
                                                }
                                            />
                                        }
                                        label={
                                            <>
                                                {property.title || fieldName}
                                                {isRequired && <span>*</span>}
                                            </>
                                        }
                                        componentsProps={{ typography: { sx: { fontWeight: 400, fontSize: '14px' } } }}
                                    />
                                </Grid>
                            </Grid>
                            <Grid item xs={12}>
                                <Divider />
                            </Grid>
                        </React.Fragment>
                    );
                })}
            </Grid>
        </>
    );
};

export default FieldsAndFiltersTable;
