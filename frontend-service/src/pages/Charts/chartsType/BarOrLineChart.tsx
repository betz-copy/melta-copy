import { Grid } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { IBasicChart, OptionsType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { AxisInput } from '../ChartPage/AggregationInput';

const BarOrLineChart: React.FC<{
    formik: FormikProps<IBasicChart>;
    formikValues: IBasicChart;
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ formik, formikValues, entityTemplate }) => {
    return (
        <Grid container direction="column" spacing={2}>
            <Grid item>
                <AxisInput
                    formikField="xAxis"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    formikValues={formikValues}
                    label={`${i18next.t('charts.axis')} x`}
                    showTitle
                    optionsType={OptionsType.AggregationAndAllProperties}
                    byFieldOptionsType={OptionsType.NumberProperties}
                />
            </Grid>
            <Grid item>
                <AxisInput
                    formikField="yAxis"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    formikValues={formikValues}
                    label={`${i18next.t('charts.axis')} y`}
                    showTitle
                    optionsType={OptionsType.AggregationAndNumberProperties}
                    byFieldOptionsType={OptionsType.NumberProperties}
                />
            </Grid>
        </Grid>
    );
};

export { BarOrLineChart };
