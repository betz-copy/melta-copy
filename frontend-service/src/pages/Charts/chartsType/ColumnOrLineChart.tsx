import { IMongoEntityTemplateWithConstraintsPopulated, OptionsType } from '@microservices/shared';
import { Grid } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { ChartForm } from '../../../interfaces/dashboard';
import { AxisInput } from '../ChartPage/AggregationInput';

const ColumnOrLineChart: React.FC<{
    formik: FormikProps<ChartForm>;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    disabled: boolean;
}> = ({ formik, entityTemplate, disabled }) => {
    return (
        <Grid container direction="column" spacing={2.5}>
            <Grid>
                <AxisInput
                    formikField="metaData.xAxis.field"
                    titleFormikField="metaData.xAxis.title"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    label={i18next.t('charts.xAxis')}
                    optionsType={OptionsType.AggregationAndAllProperties}
                    readonly={disabled}
                />
            </Grid>
            <Grid>
                <AxisInput
                    formikField="metaData.yAxis.field"
                    titleFormikField="metaData.yAxis.title"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    label={i18next.t('charts.yAxis')}
                    optionsType={OptionsType.AggregationAndNumberProperties}
                    readonly={disabled}
                />
            </Grid>
        </Grid>
    );
};

export { ColumnOrLineChart };
