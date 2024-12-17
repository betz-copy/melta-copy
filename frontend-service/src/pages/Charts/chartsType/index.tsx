import { Box, useTheme } from '@mui/material';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';

interface IChartGenerator {
    res: { xAxis: string; yAxis: string; aggregation: string; data: { x: any; y: any }[] };
    xAxis: string;
    yAxis: string;
    name: string;
    chartType: 'pie' | 'bar' | 'line';
}

const ChartType: React.FC<IChartGenerator> = ({ res, chartType, xAxis, yAxis, name }) => {
    const { data, xAxis: xLabel, yAxis: yLabel } = res;
    const theme = useTheme();
    const darkMode = theme.palette.mode === 'dark';

    const seriesData = data.map((item) => ({
        name: item.x,
        y: item.y,
    }));

    const chartOptions: Highcharts.Options = {
        chart: {
            type: chartType,
            backgroundColor: darkMode ? '#131313' : '#fcfeff',
        },
        title: {
            style: {
                color: darkMode ? '#fff' : '#000',
            },

            text: name,
        },
        xAxis: {
            gridLineColor: darkMode ? '#444' : '#dddddd',
            labels: {
                style: {
                    color: darkMode ? '#fff' : '#000',
                },
            },
            lineColor: darkMode ? '#444' : '#dddddd',
            tickColor: darkMode ? '#444' : '#dddddd',
            title: {
                style: {
                    color: darkMode ? '#fff' : '#000',
                },
                text: xLabel,
            },

            categories: data.map((point) => point.x),
        },

        yAxis: {
            gridLineColor: darkMode ? '#444' : '#dddddd',

            labels: {
                style: {
                    color: darkMode ? '#fff' : '#000',
                },
            },
            lineColor: darkMode ? '#444' : '#dddddd',
            tickColor: darkMode ? '#444' : '#dddddd',
            title: {
                style: {
                    color: darkMode ? '#fff' : '#000',
                    text: yLabel,
                },
            },
        },
        legend: {
            itemStyle: {
                color: darkMode ? '#fff' : '#000',
            },
        },
        credits: {
            enabled: false,
        },
        tooltip: {
            pointFormat: chartType === 'pie' ? '{series.name}: <b>{point.percentage:.1f}%</b>' : '<b>{point.y}</b>',
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '{point.name}: {point.percentage:.1f}%',
                },
            },
        },
        series: [
            {
                name: yLabel,
                type: chartType,
                data: chartType === 'pie' ? seriesData : seriesData.map((item) => item.y),
                color: theme.palette.primary.main,
            },
        ],
    };

    return (
        <Box
            style={{
                width: '90%',
                height: '100%',
                margin: '0 auto',
                alignContent: 'center',
            }}
        >
            {xAxis && yAxis && <HighchartsReact highcharts={Highcharts} options={chartOptions} />}
        </Box>
    );
};
export { ChartType };
