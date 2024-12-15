import React from 'react';
import { ChartTypeDetails } from '../ChartPage/ChartTypeDetails';

const BarChart: React.FC<{
    xAxis: string;
    setXAxis: React.Dispatch<React.SetStateAction<string>>;
    yAxis: string;
    setYAxis: React.Dispatch<React.SetStateAction<string>>;
}> = ({ xAxis, setXAxis, yAxis, setYAxis }) => {
    // const options: Highcharts.Options = {
    //     title: {
    //         text: 'Bar Chart Example',
    //     },
    //     chart: {
    //         type: 'bar',
    //     },
    //     series: [
    //         {
    //             name: 'Year 1990',
    //             data: [632, 727, 3202, 721],
    //         },
    //         {
    //             name: 'Year 2000',
    //             data: [814, 841, 3714, 726],
    //         },
    //         {
    //             name: 'Year 2021',
    //             data: [1393, 1031, 4695, 745],
    //         },
    //     ],
    // };

    // return <HighchartsReact highcharts={Highcharts} options={options} />;
    return <ChartTypeDetails xAxis={xAxis} setXAxis={setXAxis} yAxis={yAxis} setYAxis={setYAxis} properties={['month', 'sales', 'profit']} />;
};

export { BarChart };
