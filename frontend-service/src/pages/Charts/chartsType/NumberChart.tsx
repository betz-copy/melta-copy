import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { Grid } from '@mui/material';
import { IChart, OptionsType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { AxisInput } from '../ChartPage/AggregationInput';

const NumberChart: React.FC<{
    formik: FormikProps<IChart>;
    formikValues: IChart;
    entityTemplate: IMongoEntityTemplatePopulated;
    disabled: boolean;
}> = ({ formik, formikValues, entityTemplate, disabled }) => {
    return (
        <Grid item marginTop={2}>
            <AxisInput
                formikField="metaData.accumulator"
                formik={formik}
                entityTemplate={entityTemplate}
                formikValues={formikValues}
                label={`${i18next.t('charts.accumulateAccordingTo')}`}
                optionsType={OptionsType.Aggregation}
                readonly={disabled}
            />
        </Grid>
    );
};

export { NumberChart };
