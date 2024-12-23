import { Box, useTheme } from '@mui/material';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';
import { useQuery } from 'react-query';
import { IBasicChart, IChartType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getChartOfTemplate } from '../../../services/entitiesService';

interface IChartGenerator {
    formikValues: IBasicChart;
    template: IMongoEntityTemplatePopulated;
}

const ChartGenerator: React.FC<IChartGenerator> = ({ formikValues, template }) => {
    const { data } = useQuery(
        ['chart', template._id, formikValues.xAxis.field, formikValues.yAxis.field],
        () => getChartOfTemplate(formikValues.xAxis.field, formikValues.yAxis.field, template._id),
        {
            enabled: Boolean(formikValues.xAxis.field && formikValues.yAxis.field),
        },
    );

    const { name, description, type, xAxis, yAxis } = formikValues;

    const theme = useTheme();
    const darkMode = theme.palette.mode === 'dark';

    const seriesData = data?.map((item) => ({
        name: item.x,
        y: item.y,
    }));

    const chartOptions: Highcharts.Options = {
        chart: {
            type,
            backgroundColor: darkMode ? '#131313' : '#fcfeff',
        },
        title: {
            style: {
                color: darkMode ? '#fff' : '#000',
            },

            text: name,
        },
        subtitle: { text: description },
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
                text: xAxis.title,
            },

            categories: data?.map((point) => point.x),
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
                    text: yAxis.title,
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
            pointFormat: type === IChartType.Pie ? '{series.name}: <b>{point.percentage:.1f}%</b>' : '<b>{point.y}</b>',
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
                name: yAxis.title,
                data: type === IChartType.Pie ? seriesData : seriesData?.map((item) => item.y),
                color: theme.palette.primary.main,
                type,
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

export { ChartGenerator };
