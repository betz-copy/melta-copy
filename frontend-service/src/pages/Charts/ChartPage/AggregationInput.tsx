import { Grid, TextField, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { FormikAutoComplete } from '../../../common/inputs/FormikAutoComplete';
import { IAggregation, IBasicChart, isAggregation, OptionsType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { filteredMap } from '../../../utils/filteredMap';

interface AxisInputProps {
    formik: FormikProps<IBasicChart>;
    formikField: 'xAxis' | 'yAxis';
    formikValues: IBasicChart;
    label: string;
    entityTemplate: IMongoEntityTemplatePopulated;
    showTitle: boolean;
    optionsType: OptionsType;
}

const AxisInput: React.FC<AxisInputProps> = ({ formik, entityTemplate, formikField, formikValues, label, showTitle, optionsType }) => {
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);
    const entityTemplateDNumberFields = filteredMap(Object.entries(entityTemplate.properties.properties), ([property, value]) => ({
        include: value.type === 'number' && !value.serialStarter,
        value: property,
    }));

    const aggregationOptions: IAggregation['type'][] = ['countAll', 'countDistinct', 'average', 'sum', 'maximum', 'minimum'];

    const typeOptions: Record<OptionsType, string[]> = {
        [OptionsType.Aggregation]: aggregationOptions,
        [OptionsType.AggregationAndAllProperties]: [...entityTemplateFields, ...aggregationOptions],
        [OptionsType.AllProperties]: entityTemplateFields,
        [OptionsType.AggregationAndNumberProperties]: [...entityTemplateDNumberFields, ...aggregationOptions],
    };

    return (
        <Grid container spacing={2}>
            {showTitle && (
                <>
                    <Grid item>
                        <Typography variant="subtitle2">{label}</Typography>
                    </Grid>
                    <Grid item>
                        <TextField
                            label={`${i18next.t('charts.title')}`}
                            name={`${formikField}.title`}
                            onChange={(e) => formik.setFieldValue(`${formikField}.title`, e.target.value)}
                            value={formikValues[formikField]?.title || ''}
                            fullWidth
                            margin="normal"
                            sx={{ width: '400px' }}
                        />
                    </Grid>
                </>
            )}
            <Grid item sx={{ marginTop: showTitle ? undefined : 2 }}>
                <FormikAutoComplete
                    formik={formik}
                    formikField={isAggregation(formikValues[formikField]?.field) ? `${formikField}.field.type` : `${formikField}.field`}
                    options={typeOptions[optionsType]}
                    label={label}
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
                        label={`${i18next.t('charts.byField')}`}
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
