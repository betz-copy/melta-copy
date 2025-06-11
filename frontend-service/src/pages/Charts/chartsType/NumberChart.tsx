import { Grid } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { OptionsType } from '../../../interfaces/charts';
import { ChartForm } from '../../../interfaces/dashboard';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { AxisInput } from '../ChartPage/AggregationInput';

const NumberChart: React.FC<{
    formik: FormikProps<ChartForm>;
    entityTemplate: IMongoEntityTemplatePopulated;
    disabled: boolean;
}> = ({ formik, entityTemplate, disabled }) => {
    return (
        <Grid item marginTop={2}>
            <AxisInput
                formikField="metaData.accumulator"
                formik={formik}
                entityTemplate={entityTemplate}
                label={`${i18next.t('charts.accumulateAccordingTo')}`}
                optionsType={OptionsType.Aggregation}
                readonly={disabled}
            />
        </Grid>
    );
};

export { NumberChart };
