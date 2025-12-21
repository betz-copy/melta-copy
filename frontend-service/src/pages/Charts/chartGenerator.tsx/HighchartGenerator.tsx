import { Box, useTheme } from '@mui/material';
import { GeneratorChart, IAxis, IChart, IChartType } from '@packages/chart';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import i18next from 'i18next';
import React, { useEffect, useRef } from 'react';
import { environment } from '../../../globals';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getChartAxes } from '../../../utils/charts/getChartAxes';

const { pieChartColors } = environment.charts;

interface HighchartGeneratorProps {
    generatedChart: GeneratorChart | undefined;
    isLoading?: boolean;
    isQueryEnabled: boolean;
    chartDetails: Omit<IChart, 'filter'>;
    enableResize?: boolean;
}

const HighchartGenerator: React.FC<HighchartGeneratorProps> = ({
    generatedChart: data = [],
    isLoading,
    isQueryEnabled,
    chartDetails: { type, metaData, name, description },
    enableResize = false,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<HighchartsReact.RefObject>(null);
    const theme = useTheme();
    const darkMode = theme.palette.mode === 'dark';

    const { metadata: agGridMetaData } = useWorkspaceStore((state) => state.workspace);
    const { headlineTitleFontSize } = agGridMetaData.mainFontSizes;

    const { xAxis, yAxis } = getChartAxes(type, metaData, true);

    const commonStyles = {
        backgroundColor: darkMode ? '#131313' : '#fcfeff',
        gridLineColor: darkMode ? '#444' : '#dddddd',
        labelsColor: darkMode ? '#fff' : '#000',
        titleStyle: {
            color: theme.palette.primary.main,
            fontWeight: '700',
            fontSize: headlineTitleFontSize,
            fontFamily: 'Rubik',
            textAlign: 'center',
            marginBottom: '2%',
            top: '0px',
        },
        subtitleStyle: { color: theme.palette.primary.main, fontSize: '1rem', fontFamily: 'Rubik', textAlign: 'center', minHeight: '1.5em' },
    };

    const { backgroundColor, gridLineColor, labelsColor, titleStyle, subtitleStyle } = commonStyles;

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
                render() {
                    const chart = this as Highcharts.Chart & { customTotalLabel?: Highcharts.SVGElement };
                    const total = seriesData.reduce((sum, d) => sum + (d.y ?? 0), 0);
                    if (chart.customTotalLabel) chart.customTotalLabel.destroy();

                    if (type === IChartType.Pie)
                        chart.customTotalLabel = chart.renderer
                            .text(`${i18next.t('dashboard.charts.total')} : ${total}`, 10, chart.chartHeight)
                            .css({
                                color: labelsColor,
                                fontSize: '15px',
                                fontWeight: '600',
                                fontFamily: 'Rubik',
                            })
                            .add();
                },
            },
        },
        title: {
            text: name,
            style: titleStyle,
        },
        subtitle: {
            text: description,
            style: subtitleStyle,
        },

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
        legend: {
            itemStyle: { color: labelsColor },
            enabled: type === IChartType.Pie,
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'middle',
            labelFormatter() {
                const point = this as Highcharts.Point;
                const pointName = point.name ?? '-';
                const y = point.y ?? 0;

                const percentage = point.percentage != null ? `${point.percentage.toFixed(1)}%` : '-';
                return `${pointName}: ${y} ${percentage}`;
            },
        },
        credits: {
            enabled: false,
        },
        tooltip: {
            pointFormat: type === IChartType.Pie ? ' <b>{point.y}   {point.percentage:.1f}%</b>' : '<b>{point.y}</b>',
        },
        plotOptions: {
            pie: {
                innerSize: '50%',
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false,
                },
                colors: pieChartColors.slice(),
                showInLegend: true,
            },
        },
        series: [
            {
                data: type === IChartType.Pie ? seriesData : seriesData.map(({ y }) => y),
                color: theme.palette.primary.main,
                type: type as Exclude<IChartType, IChartType.Number>,
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
