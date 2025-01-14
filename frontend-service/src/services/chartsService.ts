import axios from '../axios';
import { environment } from '../globals';
import { IBasicChart, IChart } from '../interfaces/charts';

const { charts } = environment.api;

export const createChart = async (newChart: IBasicChart) => {
    const { data } = await axios.post<IChart>(charts, newChart);
    return data;
};

export const deleteChart = async (chartId: string) => {
    const { data } = await axios.delete<IChart>(`${charts}/${chartId}`);
    return data;
};
