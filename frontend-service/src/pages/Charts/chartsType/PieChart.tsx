import { Grid } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { IBasicChart, OptionsType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { AxisInput } from '../ChartPage/AggregationInput';

const PieChart: React.FC<{ formik: FormikProps<IBasicChart>; formikValues: IBasicChart; entityTemplate: IMongoEntityTemplatePopulated }> = ({
    formik,
    formikValues,
    entityTemplate,
}) => {
    return (
        <Grid container direction="column" spacing={2}>
            <Grid item>
                <AxisInput
                    formikField="metaData.dividedByField"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    formikValues={formikValues}
                    label={`${i18next.t('charts.dividedBy')}`}
                    optionsType={OptionsType.AllProperties}
                />
            </Grid>
            <Grid item>
                <AxisInput
                    formikField="metaData.aggregationType"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    formikValues={formikValues}
                    label={`${i18next.t('charts.sumBy')}`}
                    optionsType={OptionsType.Aggregation}
                />
            </Grid>
        </Grid>
    );
};

export { PieChart };
