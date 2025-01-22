import axios from '../axios';
import { environment } from '../globals';
import { ChartsAndGenerator, IBasicChart, IChart } from '../interfaces/charts';

const { charts } = environment.api;

export const createChart = async (newChart: IBasicChart) => {
    const { data } = await axios.post<IChart>(charts, newChart);
    return data;
};

export const getChartById = async (chartId: string) => {
    const { data } = await axios.get<IChart>(`${charts}/${chartId}`);
    return data;
};

export const getChartByTemplateId = async (templateId: string) => {
    const { data } = await axios.get<ChartsAndGenerator[]>(`${charts}/by-template/${templateId}`);
    return data;
};

export const deleteChart = async (chartId: string) => {
    const { data } = await axios.delete<IChart>(`${charts}/${chartId}`);
    return data;
};
