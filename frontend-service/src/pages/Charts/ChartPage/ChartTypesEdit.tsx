import { BarChart as BarChartIcon, PieChart as PieChartIcon, Money as NumberChartIcon, ShowChart as ShowChartIcon } from '@mui/icons-material';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import React, { ReactNode, useState } from 'react';
import i18next from 'i18next';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { BarChart } from '../chartsType/BarChart';
import { LineChart } from '../chartsType/LineChart';
import { NumberChart } from '../chartsType/NumberChart';
import { PieChart } from '../chartsType/PieChart';

const ChartTypeButton: React.FC<{
    icon: React.ElementType;
    buttonId: string;
    selectedButton: string | null;
    handleClick: (buttonId: string) => void;
    popoverText: string;
}> = ({ icon: Icon, buttonId, selectedButton, handleClick, popoverText }) => {
    const theme = useTheme();

    return (
        <IconButtonWithPopover
            iconButtonProps={{
                onClick: () => {
                    handleClick(buttonId);
                },
            }}
            style={{
                color: selectedButton === buttonId ? theme.palette.secondary.main : theme.palette.primary.main,
                borderRadius: '5px',
                padding: '8px',
            }}
            popoverText={popoverText}
        >
            <Icon fontSize="large" />
        </IconButtonWithPopover>
    );
};

interface ChartProps {
    xAxis: string;
    setXAxis: React.Dispatch<React.SetStateAction<string>>;
    yAxis: string;
    setYAxis: React.Dispatch<React.SetStateAction<string>>;
}

const withChartProps = (
    ChartComponent: React.FC<ChartProps>,
    xAxis: string,
    setXAxis: React.Dispatch<React.SetStateAction<string>>,
    yAxis: string,
    setYAxis: React.Dispatch<React.SetStateAction<string>>,
): ReactNode => <ChartComponent xAxis={xAxis} setXAxis={setXAxis} yAxis={yAxis} setYAxis={setYAxis} />;
// const chartsEditCompetent: Record<string, ReactNode> = {
//     numberChart: <NumberChart />,
//     barChart: <BarChart />,
//     pieChart: <PieChart />,
//     lineChart: <LineChart />,
// };

const ChartTypesEdit: React.FC<{
    xAxis: string;
    setXAxis: React.Dispatch<React.SetStateAction<string>>;
    yAxis: string;
    setYAxis: React.Dispatch<React.SetStateAction<string>>;
}> = ({ xAxis, setXAxis, yAxis, setYAxis }) => {
    const [selectedButton, setSelectedButton] = useState<string | null>(null);

    const handleButtonClick = (buttonId: string) => {
        setSelectedButton(buttonId);
    };

    const chartsEditComponent: Record<string, ReactNode> = {
        numberChart: withChartProps(NumberChart, xAxis, setXAxis, yAxis, setYAxis),
        barChart: withChartProps(BarChart, xAxis, setXAxis, yAxis, setYAxis),
        pieChart: withChartProps(PieChart, xAxis, setXAxis, yAxis, setYAxis),
        lineChart: withChartProps(LineChart, xAxis, setXAxis, yAxis, setYAxis),
    };

    return (
        <Grid>
            <Grid item marginTop={2}>
                <Typography variant="subtitle1">{i18next.t('charts.chartDetails')}</Typography>

                <Grid item container spacing={2} marginTop={2}>
                    <ChartTypeButton
                        icon={NumberChartIcon}
                        buttonId="numberChart"
                        selectedButton={selectedButton}
                        handleClick={handleButtonClick}
                        popoverText="Line Chart Settings"
                    />
                    <ChartTypeButton
                        icon={BarChartIcon}
                        buttonId="barChart"
                        selectedButton={selectedButton}
                        handleClick={handleButtonClick}
                        popoverText="Bar Chart Settings"
                    />
                    <ChartTypeButton
                        icon={PieChartIcon}
                        buttonId="pieChart"
                        selectedButton={selectedButton}
                        handleClick={handleButtonClick}
                        popoverText="Pie Chart Settings"
                    />
                    <ChartTypeButton
                        icon={ShowChartIcon}
                        buttonId="lineChart"
                        selectedButton={selectedButton}
                        handleClick={handleButtonClick}
                        popoverText="Line Chart Settings"
                    />
                </Grid>
            </Grid>

            <Grid item>
                <Box marginTop={3}>{chartsEditComponent[selectedButton || '']}</Box>
            </Grid>
        </Grid>
    );
};
export { ChartTypesEdit };
