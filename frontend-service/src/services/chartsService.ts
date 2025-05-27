import axios from '../axios';
import { environment } from '../globals';
import { ChartsAndGenerator, IChart, IPermission } from '../interfaces/charts';

const { charts } = environment.api;

type ChartWithStringFilter = Omit<IChart, 'filter'> & { filter?: string };

export const createChart = async (newChart: ChartWithStringFilter, toDashboard: boolean = false) => {
    const { data } = await axios.post<IChart>(charts, { chart: newChart, toDashboard });
    return data;
};

export const editChart = async (chartId: string, updatedChart: ChartWithStringFilter) => {
    const { _id, usedInDashboard, createdAt, updatedAt, ...restChart } = updatedChart;

    const deleteReferenceDashboardItems = usedInDashboard && updatedChart.permission === IPermission.Private;

    const { data } = await axios.put<IChart>(`${charts}/${chartId}`, restChart, {
        params: {
            deleteReferenceDashboardItems,
        },
    });
    return data;
};

export const getChartById = async (chartId: string) => {
    const { data } = await axios.get<IChart>(`${charts}/${chartId}`);
    return data;
};

export const getChartByTemplateId = async (templateId: string, textSearch?: string) => {
    const { data } = await axios.post<ChartsAndGenerator[]>(`${charts}/by-template/${templateId}`, { textSearch });
    return data;
};

export const getChartsByUserId = async (templateId: string, textSearch?: string) => {
    const { data } = await axios.post<IChart[]>(`${charts}/by-user/${templateId}`, { textSearch });
    return data;
};

export const deleteChart = async (chartId: string, usedInDashboard?: boolean) => {
    const { data } = await axios.delete<IChart>(`${charts}/${chartId}`, {
        params: {
            deleteReferenceDashboardItems: usedInDashboard,
        },
    });
    return data;
};
