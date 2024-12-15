import { useTheme } from '@mui/material';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';

interface IChartGenerator {
    data: any[];
    xAxis: string;
    yAxis: string;
    name: string;
}

const ChartType: React.FC<IChartGenerator> = ({ xAxis, yAxis, name, data }) => {
    const theme = useTheme();
    const darkMode = theme.palette.mode === 'dark';

    const chartOptions = {
        chart: {
            type: 'line',
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
                text: xAxis,
            },

            categories: data.map((row) => row[xAxis]),
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
                },
            },
        },
        legend: {
            itemStyle: {
                color: darkMode ? '#fff' : '#000',
            },
        },
        credits: 'foo',
        series: [
            {
                name: yAxis,
                data: data.map((row) => row[yAxis]),
                color: theme.palette.primary.main,
            },
        ],
    };

    return (
        <div
            style={{
                width: '90%',
                height: '100%',
                margin: '0 auto',
                alignContent: 'center',
            }}
        >
            {xAxis && yAxis && <HighchartsReact highcharts={Highcharts} options={chartOptions} />}
        </div>
    );
};
export { ChartType };
