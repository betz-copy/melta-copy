import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';

const PieChart: React.FC = () => {
    const options: Highcharts.Options = {
        title: {
            text: 'Pie Chart Example',
        },
        series: [
            {
                type: 'pie',
                data: [
                    { name: 'Apple', y: 40 },
                    { name: 'Orange', y: 30 },
                    { name: 'Banana', y: 30 },
                ],
            },
        ],
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export { PieChart };
