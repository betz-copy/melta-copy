import { useTheme } from '@mui/material';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';

interface IChartGenerator {
    res: { xAxis: string; yAxis: string; aggregation: string; data: { x: any; y: any }[] };
    xAxis: string;
    yAxis: string;
    name: string;
}

const ChartType: React.FC<IChartGenerator> = ({ xAxis, yAxis, name, res }) => {
    const { data, xAxis: xLabel, yAxis: yLabel } = res;
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
                text: xLabel,
            },

            categories: data.map((point) => point.x),
        },
        colorAxis: {
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
        series: [
            {
                name: yLabel,
                data: data.map((point) => point.y),
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
