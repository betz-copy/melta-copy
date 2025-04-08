/* eslint-disable react-hooks/exhaustive-deps */
import { Box, useTheme } from '@mui/material';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React, { useEffect, useRef } from 'react';
import { HighchartType, IAxis, IChartType, IChartTypeMetaData } from '../../../interfaces/charts';
import { getChartAxes } from '../../../utils/charts/getChartAxes';

interface HighchartGeneratorProps {
    data: { x: any; y: number }[] | undefined;
    isLoading: boolean;
    name: string;
    description: string;
    metaData: IChartTypeMetaData;
    isQueryEnabled: boolean;
    type: HighchartType;
    enableResize?: boolean;
}

const HighchartGenerator: React.FC<HighchartGeneratorProps> = ({
    data = [],
    isLoading,
    isQueryEnabled,
    type,
    name,
    description,
    metaData,
    enableResize = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<HighchartsReact.RefObject>(null);
    const theme = useTheme();
    const darkMode = theme.palette.mode === 'dark';

    const { xAxis, yAxis } = getChartAxes(type, metaData, true);

    const commonStyles = {
        backgroundColor: darkMode ? '#131313' : '#fcfeff',
        gridLineColor: darkMode ? '#444' : '#dddddd',
        labelsColor: darkMode ? '#fff' : '#000',
    };

    const { backgroundColor, gridLineColor, labelsColor } = commonStyles;

    const seriesData = data.map(({ x, y }) => ({ name: x, y }));

    const resizeChart = () => {
        if (!chartRef.current || !containerRef.current) return;
        const newHeight = enableResize ? containerRef.current.offsetHeight : undefined;
        chartRef.current.chart.setSize(undefined, newHeight);
    };

    useEffect(() => {
        window.addEventListener('resize', resizeChart);
        return () => window.removeEventListener('resize', resizeChart);
    }, []);

    useEffect(() => {
        const observer = new ResizeObserver(resizeChart);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const chartOptions: Highcharts.Options = {
        chart: {
            type,
            backgroundColor,
            events: {
                load() {
                    const chart = this;

                    // Example: Sum of values
                    const total = chart.series[0].data.reduce((sum, point) => sum + point.y, 0);
                    const displayText = `Total: ${total}`;

                    const centerX = chart.plotLeft + chart.plotWidth / 2;
                    const centerY = chart.plotTop + chart.plotHeight / 2;

                    const text = chart.renderer
                        .text(displayText, centerX, centerY)
                        .css({
                            color: '#000',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        })
                        .attr({
                            align: 'center',
                        })
                        .add();

                    // Center the text manually
                    const bbox = text.getBBox();
                    text.attr({
                        x: centerX - bbox.width / 2,
                        y: centerY + bbox.height / 4,
                    });
                },
            },
        },
        title: {
            text: name,
            style: {
                color: labelsColor,
            },
        },
        subtitle: { text: description },
        xAxis: {
            categories: data.map(({ x }) => x ?? '-'),
            gridLineColor,
            lineColor: gridLineColor,
            tickColor: gridLineColor,
            title: { text: (xAxis as IAxis).title, style: { color: labelsColor } },
            labels: { style: { color: labelsColor } },
        },
        yAxis: {
            gridLineColor,
            labels: { style: { color: labelsColor } },
            lineColor: gridLineColor,
            tickColor: gridLineColor,
            title: { text: (yAxis as IAxis).title, style: { color: labelsColor } },
        },
        // legend: {
        //     itemStyle: { color: labelsColor },
        //     // enabled: type === IChartType.Pie,
        //     layout: 'vertical',
        //     align: 'left',
        //     verticalAlign: 'middle',
        //     labelFormatter() {
        //         const point = this as Highcharts.Point;
        //         const pointName = point.name ?? '-';
        //         const percentage = point.percentage != null ? `${point.percentage.toFixed(1)}%` : '-';
        //         return `${pointName}: ${percentage}`;
        //     },
        // },
        credits: {
            enabled: false,
        },
        tooltip: {
            pointFormat:
                type === IChartType.Pie ? '{point.name}<br/>Value: <b>{point.y}</b><br/>Percent: <b>{point.percentage:.1f}%</b>' : '<b>{point.y}</b>',
        },
        plotOptions: {
            pie: {
                // allowPointSelect: true,
                // cursor: 'pointer',
                dataLabels: {
                    enabled: true, // <- turn them ON

                    format: '<b>{point.name}</b>: {point.y}', // or use {point.percentage:.1f}% if preferred
                    style: {
                        color: 'contrast', // ensures it’s readable regardless of slice color
                        textOutline: 'none', // cleaner text
                        fontSize: '18px',
                        fontWeight: 'bold',
                    },
                },

                // showInLegend: true,
                innerSize: '50%', // <- 👈 This makes it a donut!
            },
        },
        series: [
            {
                data: type === IChartType.Pie ? seriesData : seriesData.map(({ y }) => y),
                color: theme.palette.primary.main,
                type,
            },
        ],
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                width: enableResize ? '100%' : '75%',
                height: enableResize ? '100%' : '50%',
                margin: '0 auto',
                alignContent: 'center',
                backgroundColor: darkMode ? '#131313' : '#fcfeff',
            }}
        >
            {isQueryEnabled && !isLoading && <HighchartsReact highcharts={Highcharts} options={chartOptions} ref={chartRef} />}
        </Box>
    );
};

export { HighchartGenerator };
