import { BarChart as BarChartIcon, Money as NumberChartIcon, PieChart as PieChartIcon, ShowChart as ShowChartIcon } from '@mui/icons-material';
import { Box, Grid, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { IBasicChart, IChartType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { initializeChartMetaData } from '../../../utils/charts/getChartAxes';
import { NumberChart } from '../chartsType/NumberChart';
import { PieChart } from '../chartsType/PieChart';
import { ChartTypeButton } from './ChartTypeButton';
import { ColumnOrLineChart } from '../chartsType/ColumnOrLineChart';

interface ChartProps {
    formik: FormikProps<IBasicChart>;
    formikValues: IBasicChart;
    entityTemplate: IMongoEntityTemplatePopulated;
}

const charts: Record<IChartType, React.FC<ChartProps>> = {
    [IChartType.Number]: NumberChart,
    [IChartType.Column]: ColumnOrLineChart,
    [IChartType.Pie]: PieChart,
    [IChartType.Line]: ColumnOrLineChart,
};

const chartTypeButtons = [
    { icon: NumberChartIcon, type: IChartType.Number, label: i18next.t('charts.numberChart') },
    { icon: BarChartIcon, type: IChartType.Column, label: i18next.t('charts.barChart') },
    { icon: PieChartIcon, type: IChartType.Pie, label: i18next.t('charts.pieChart') },
    { icon: ShowChartIcon, type: IChartType.Line, label: i18next.t('charts.lineChart') },
];

const ChartTypesEdit: React.FC<ChartProps> = ({ formik, formikValues, entityTemplate }) => {
    const SelectedChartType = useMemo(() => charts[formikValues.type], [formikValues.type]);

    const handleButtonClick = (buttonId: IChartType) => {
        formik.setFieldValue('type', buttonId);
        formik.setFieldValue('metaData', initializeChartMetaData(buttonId));
    };

    return (
        <Grid>
            <Grid item marginTop={2}>
                <Typography variant="subtitle1">{i18next.t('charts.chartDetails')}</Typography>

                <Grid item container spacing={2} marginTop={2}>
                    {chartTypeButtons.map(({ icon, type, label }) => (
                        <ChartTypeButton
                            key={type}
                            icon={icon}
                            buttonId={type}
                            selectedButton={formikValues.type}
                            handleClick={handleButtonClick}
                            popoverText={label}
                        />
                    ))}
                </Grid>
            </Grid>

            <Grid item>
                <Box>{formikValues.type && <SelectedChartType formik={formik} formikValues={formikValues} entityTemplate={entityTemplate} />}</Box>
            </Grid>
        </Grid>
    );
};

export { ChartTypesEdit };
