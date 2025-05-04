import axios from '../axios';
import { environment } from '../globals';
import { ChartsAndGenerator, IChart, IMongoChart } from '../interfaces/charts';

const { charts } = environment.api;

export const createChart = async (newChart: IChart) => {
    const { data } = await axios.post<IMongoChart>(charts, newChart);
    return data;
};

export const editChart = async (chartId: string, updatedChart: IMongoChart) => {
    const { _id, createdAt, updatedAt, ...restChart } = updatedChart;

    const { data } = await axios.put<IMongoChart>(`${charts}/${chartId}`, restChart);
    return data;
};

export const getChartById = async (chartId: string) => {
    const { data } = await axios.get<IMongoChart>(`${charts}/${chartId}`);
    return data;
};

export const getChartByTemplateId = async (templateId: string, textSearch?: string) => {
    const { data } = await axios.post<ChartsAndGenerator[]>(`${charts}/by-template/${templateId}`, { textSearch });
    return data;
};

export const deleteChart = async (chartId: string) => {
    const { data } = await axios.delete<IMongoChart>(`${charts}/${chartId}`);
    return data;
};
