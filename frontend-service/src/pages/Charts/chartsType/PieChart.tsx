import { Grid } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { OptionsType } from '../../../interfaces/charts';
import { ChartForm } from '../../../interfaces/dashboard';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { AxisInput } from '../ChartPage/AggregationInput';

const PieChart: React.FC<{
    formik: FormikProps<ChartForm & { _id: string }>;
    entityTemplate: IMongoEntityTemplatePopulated;
    disabled: boolean;
}> = ({ formik, entityTemplate, disabled }) => {
    return (
        <Grid container direction="column" spacing={2}>
            <Grid>
                <AxisInput
                    formikField="metaData.dividedByField"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    label={`${i18next.t('charts.dividedBy')}`}
                    optionsType={OptionsType.AllProperties}
                    readonly={disabled}
                />
            </Grid>
            <Grid>
                <AxisInput
                    formikField="metaData.aggregationType"
                    formik={formik}
                    entityTemplate={entityTemplate}
                    label={`${i18next.t('charts.sumBy')}`}
                    optionsType={OptionsType.Aggregation}
                    readonly={disabled}
                />
            </Grid>
        </Grid>
    );
};

export { PieChart };
