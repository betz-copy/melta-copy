import { FormikProps } from 'formik';
import i18next from 'i18next';
import React from 'react';
import { IBasicChart, OptionsType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { AxisInput } from '../ChartPage/AggregationInput';

const NumberChart: React.FC<{
    formik: FormikProps<IBasicChart>;
    formikValues: IBasicChart;
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ formik, formikValues, entityTemplate }) => {
    return (
        <AxisInput
            formikField="metaData.accumulator"
            formik={formik}
            entityTemplate={entityTemplate}
            formikValues={formikValues}
            label={`${i18next.t('charts.AccumulateAccordingTo')}`}
            optionsType={OptionsType.Aggregation}
            byFieldOptionsType={OptionsType.AllProperties}
        />
    );
};

export { NumberChart };
