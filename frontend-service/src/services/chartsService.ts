import axios from '../axios';
import { environment } from '../globals';
import { ChartsAndGenerator, IMongoChart, IPermission } from '../interfaces/charts';
import { ChartToBackend, MongoBaseFields } from '../interfaces/dashboard';

const { charts } = environment.api;

export const createChart = async (newChart: ChartToBackend, toDashboard: boolean = false) => {
    const { data } = await axios.post<IMongoChart>(charts, newChart, { params: { toDashboard } });
    return data;
};

export const editChart = async (chartId: string, updatedChart: ChartToBackend & Partial<MongoBaseFields>, prevChildTemplateId?: string) => {
    const { usedInDashboard, _id, createdAt, updatedAt, childTemplateId, ...restChart } = updatedChart;

    const deleteReferenceDashboardItems = usedInDashboard && updatedChart.permission === IPermission.Private;

    const { data } = await axios.put<IMongoChart>(
        `${charts}/${chartId}`,
        { ...restChart, childTemplateId: childTemplateId || prevChildTemplateId },
        {
            params: {
                deleteReferenceDashboardItems,
            },
        },
    );
    return data;
};

export const getChartById = async (chartId: string) => {
    const { data } = await axios.get<IMongoChart>(`${charts}/${chartId}`);
    return data;
};

export const getChartByTemplateId = async (templateId: string, textSearch?: string, childTemplateId?: string) => {
    const { data } = await axios.post<ChartsAndGenerator[]>(`${charts}/by-template/${templateId}`, { textSearch, childTemplateId });
    return data;
};

export const getChartsByUserId = async (templateId: string, textSearch?: string, childTemplateId?: string) => {
    const { data } = await axios.post<IMongoChart[]>(`${charts}/by-user/${templateId}`, { textSearch, childTemplateId });
    return data;
};

export const deleteChart = async (chartId: string, usedInDashboard?: boolean) => {
    const { data } = await axios.delete<IMongoChart>(`${charts}/${chartId}`, {
        params: {
            deleteReferenceDashboardItems: usedInDashboard,
        },
    });
    return data;
};
