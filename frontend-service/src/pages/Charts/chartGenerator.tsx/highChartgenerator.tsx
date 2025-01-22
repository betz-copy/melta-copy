import { Box, useTheme } from '@mui/material';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React, { useEffect, useRef } from 'react';
import { HighchartType, IChartType, IChartTypeMetaData } from '../../../interfaces/charts';
import { getChartAxes } from '../../../utils/charts/getChartAxes';

interface HighchartGeneratorProps {
    data: { x: any; y: any }[] | undefined;
    isLoading: boolean;
    name: string;
    description: string;
    metaData: IChartTypeMetaData;
    isQueryEnabled: boolean;
    type: HighchartType;
    enableRsize?: boolean;
}

const HiighchartGenerator: React.FC<HighchartGeneratorProps> = ({
    data,
    isLoading,
    isQueryEnabled,
    type,
    name,
    description,
    metaData,
    enableRsize = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<HighchartsReact.RefObject>(null);

    const { xAxis, yAxis } = getChartAxes(type, metaData);

    const theme = useTheme();

    const darkMode = theme.palette.mode === 'dark';

    const seriesData = data?.map((item) => ({
        name: item.x,
        y: item.y,
    }));

    // TODO: refactor and eslint errors
    const resizeChart = () => {
        if (chartRef.current && containerRef.current) {
            const newHeight = enableRsize ? containerRef.current.offsetHeight : undefined;
            chartRef.current.chart.setSize(undefined, newHeight);
        }
    };

    useEffect(() => {
        const handleResize = () => resizeChart();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const observer = new ResizeObserver(() => resizeChart());

        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, []);

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

            categories: data?.map((point) => point.x ?? '-'),
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
                    formatter() {
                        const point = this as Highcharts.Point;

                        const pointName = point.name ?? '-';
                        const percentage = point.percentage != null ? `${point.percentage.toFixed(1)}%` : '-';
                        return `${pointName}: ${percentage}`;
                    },
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
            ref={containerRef}
            style={{
                width: '100%%',
                height: '100%',
                margin: '0 auto',
                alignContent: 'center',
            }}
        >
            {isQueryEnabled && !isLoading && <HighchartsReact highcharts={Highcharts} options={chartOptions} ref={chartRef} />}
        </Box>
    );
};

export { HiighchartGenerator };
