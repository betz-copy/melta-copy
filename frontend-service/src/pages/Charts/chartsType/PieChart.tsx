import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';

const chartData = [
    { x: 'Water', y: 55.02 },
    { x: 'Fat', y: 26.71 },
    { x: 'Carbohydrates', y: 1.09 },
    { x: 'Protein', y: 15.5 },
    { x: 'Ash', y: 1.68 },
];

const highchartsData = chartData.map((point) => ({
    name: point.x,
    y: point.y,
}));

const PieChart: React.FC = () => {
    const options: Highcharts.Options = {
        chart: {
            type: 'pie',
        },
        title: {
            text: 'Egg Yolk Composition',
        },
        subtitle: {
            text: 'Source: <a href="https://www.mdpi.com/2072-6643/11/3/684/htm" target="_default">MDPI</a>',
        },
        tooltip: {
            valueSuffix: '%',
        },
        plotOptions: {
            series: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: [
                    {
                        enabled: true,
                        distance: 20,
                    },
                    {
                        enabled: true,
                        distance: -40,
                        format: '{point.percentage:.1f}%',
                        style: {
                            fontSize: '1.2em',
                            textOutline: 'none',
                            opacity: 0.7,
                        },
                    },
                ],
            },
        },
        series: [
            {
                type: 'pie',
                name: 'Percentage',
                data: highchartsData,
            },
        ],
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export { PieChart };
