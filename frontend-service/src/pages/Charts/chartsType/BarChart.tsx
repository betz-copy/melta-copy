import { Grid } from '@mui/material';
import { FormikProps } from 'formik';
import React from 'react';
import { Axises, IBasicChart } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { AxisInput } from '../ChartPage/AggregationInput';

const BarOrLineChart: React.FC<{
    formik: FormikProps<IBasicChart>;
    formikValues: IBasicChart;
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ formik, formikValues, entityTemplate }) => {
    return (
        <Grid container spacing={2}>
            <Grid item>
                <AxisInput formikField="xAxis" axis={Axises.X} formik={formik} entityTemplate={entityTemplate} formikValues={formikValues} />
            </Grid>
            <Grid item>
                <AxisInput formikField="yAxis" axis={Axises.Y} formik={formik} entityTemplate={entityTemplate} formikValues={formikValues} />
            </Grid>
        </Grid>
    );
};

export { BarOrLineChart };
