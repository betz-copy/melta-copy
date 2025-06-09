import { BarChart as BarChartIcon, Money as NumberChartIcon, PieChart as PieChartIcon, ShowChart as ShowChartIcon } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useMemo } from 'react';
import { IChart, IChartType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { initializeChartMetaData } from '../../../utils/charts/getChartAxes';
import { ColumnOrLineChart } from '../chartsType/ColumnOrLineChart';
import { NumberChart } from '../chartsType/NumberChart';
import { PieChart } from '../chartsType/PieChart';
import { ChartTypeButton } from './ChartTypeButton';

interface ChartProps {
    formik: FormikProps<IChart>;
    formikValues: IChart;
    entityTemplate: IMongoEntityTemplatePopulated;
    disabled: boolean;
}

const charts: Record<IChartType, React.FC<ChartProps>> = {
    [IChartType.Number]: NumberChart,
    [IChartType.Column]: ColumnOrLineChart,
    [IChartType.Pie]: PieChart,
    [IChartType.Line]: ColumnOrLineChart,
};

const chartTypeButtons = [
    { icon: NumberChartIcon, type: IChartType.Number, label: i18next.t('charts.types.numberChart') },
    { icon: BarChartIcon, type: IChartType.Column, label: i18next.t('charts.types.barChart') },
    { icon: PieChartIcon, type: IChartType.Pie, label: i18next.t('charts.types.pieChart') },
    { icon: ShowChartIcon, type: IChartType.Line, label: i18next.t('charts.types.lineChart') },
];

const ChartTypesEdit: React.FC<ChartProps> = ({ formik, formikValues, entityTemplate, disabled }) => {
    const SelectedChartType = useMemo(() => charts[formikValues.type], [formikValues.type]);

    const handleButtonClick = (buttonId: IChartType) => {
        formik.setFieldValue('type', buttonId);
        formik.setFieldValue('metaData', initializeChartMetaData(buttonId));
    };

    return (
        <Grid container direction="column" spacing={2}>
            <Grid item container direction="column" spacing={1}>
                <Grid item>
                    <Typography fontSize="14px" fontWeight="400" color="#9398C2">
                        {i18next.t('charts.chartType')}
                    </Typography>
                </Grid>

                <Grid item>
                    {chartTypeButtons.map(({ icon, type, label }) => (
                        <ChartTypeButton
                            key={type}
                            icon={icon}
                            buttonId={type}
                            selectedButton={formikValues.type}
                            handleClick={handleButtonClick}
                            popoverText={label}
                            disabled={disabled}
                        />
                    ))}
                </Grid>
            </Grid>

            <Grid item>
                {formikValues.type && (
                    <SelectedChartType formik={formik} formikValues={formikValues} entityTemplate={entityTemplate} disabled={disabled} />
                )}
            </Grid>
        </Grid>
    );
};

export { ChartTypesEdit };
