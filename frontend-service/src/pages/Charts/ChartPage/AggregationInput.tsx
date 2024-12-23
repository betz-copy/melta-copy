import { Grid, TextField, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { FormikAutoComplete } from '../../../common/inputs/FormikAutoComplete';
import { Axises, IAggregation, IBasicChart, isAggregation } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { filteredMap } from '../../../utils/filteredMap';

const AxisInput: React.FC<{
    formik: FormikProps<IBasicChart>;
    formikField: 'xAxis' | 'yAxis';
    formikValues: IBasicChart;
    axis: Axises;
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ formik, axis, entityTemplate, formikField, formikValues }) => {
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);
    const entityTemplateDNumberFields = filteredMap(Object.entries(entityTemplate.properties.properties), ([property, value]) => ({
        include: value.type === 'number' && !value.serialStarter,
        value: property,
    }));
    const aggregationOptions: IAggregation['type'][] = ['countAll', 'countDistinct', 'average', 'sum', 'maximum', 'minimum'];
    const options = [...(axis === Axises.X ? entityTemplateFields : entityTemplateDNumberFields), ...aggregationOptions];

    return (
        <Grid container spacing={2}>
            <Grid item>
                <Typography variant="subtitle2">{`${i18next.t('charts.axis')} ${axis}`}</Typography>
            </Grid>
            <Grid item>
                <TextField
                    label={`${formikField === 'xAxis' ? 'X Axis' : 'Y Axis'} Title`}
                    name={`${formikField}.title`}
                    onChange={(e) => formik.setFieldValue(`${formikField}.title`, e.target.value)}
                    value={formikValues[formikField]?.title || ''}
                    fullWidth
                    margin="normal"
                    sx={{ width: '400px' }}
                />
            </Grid>
            <Grid item>
                <FormikAutoComplete
                    formik={formik}
                    formikField={isAggregation(formikValues[formikField]?.field) ? `${formikField}.field.type` : `${formikField}.field`}
                    options={options}
                    label={`${i18next.t('charts.axis')} ${axis}`}
                    multiple={false}
                    onChange={(newValue) => {
                        if (newValue && typeof newValue === 'string' && aggregationOptions.includes(newValue as IAggregation['type']))
                            formik.setFieldValue(`${formikField}.field`, { type: newValue } as IAggregation);
                        else formik.setFieldValue(`${formikField}.field`, newValue as string);
                    }}
                    style={{ width: '400px' }}
                />
            </Grid>
            {isAggregation(formikValues[formikField]?.field) && formikValues[formikField]?.field.type !== 'countAll' && (
                <Grid item>
                    <FormikAutoComplete
                        formik={formik}
                        formikField={`${formikField}.field.byField`}
                        options={entityTemplateDNumberFields}
                        label="Aggregation By Field"
                        multiple={false}
                        style={{
                            width: '250px',
                        }}
                    />
                </Grid>
            )}
        </Grid>
    );
};

export { AxisInput };
