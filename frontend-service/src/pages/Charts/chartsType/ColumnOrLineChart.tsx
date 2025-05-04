import { Grid } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { IChart, OptionsType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { AxisInput } from '../ChartPage/AggregationInput';

const ColumnOrLineChart: React.FC<{
    formik: FormikProps<IChart>;
    formikValues: IChart;
    entityTemplate: IMongoEntityTemplatePopulated;
    disabled: boolean;
}> = ({ formik, formikValues, entityTemplate, disabled }) => {
    return (
        <Grid container direction="column" spacing={2} marginTop={1}>
            <Grid item>
                <AxisInput
                    formikField="metaData.xAxis.field"
                    titleFormikField="metaData.xAxis.title"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    formikValues={formikValues}
                    label={`${i18next.t('charts.axis')} x`}
                    optionsType={OptionsType.AggregationAndAllProperties}
                    readonly={disabled}
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
                    readonly={disabled}
                />
            </Grid>
        </Grid>
    );
};

export { ColumnOrLineChart };
