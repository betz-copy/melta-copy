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
                    formikField="metaData.xAxis.field"
                    titleFormikField="metaData.xAxis.title"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    formikValues={formikValues}
                    label={`${i18next.t('charts.axis')} x`}
                    optionsType={OptionsType.AggregationAndAllProperties}
                    byFieldOptionsType={OptionsType.NumberProperties}
                />
            </Grid>
            <Grid item>
                <AxisInput
                    formikField="metaData.yAxis.field"
                    titleFormikField="metaData.yAxis.title"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    formikValues={formikValues}
                    label={`${i18next.t('charts.axis')} y`}
                    optionsType={OptionsType.AggregationAndNumberProperties}
                    byFieldOptionsType={OptionsType.NumberProperties}
                />
            </Grid>
        </Grid>
    );
};

export { BarOrLineChart };
