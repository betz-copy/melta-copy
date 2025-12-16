import { DashboardItem, MongoDashboardItem, MongoDashboardItemPopulated, TableItem } from '@microservices/shared';
import axios from '../axios';
import { environment } from '../globals';
import { TableItemToBackend } from '../interfaces/dashboard';

const { dashboard } = environment.api;

export const createDashboardItem = async (newDashboardItem: DashboardItem | TableItemToBackend) => {
    const { data } = await axios.post<MongoDashboardItem>(dashboard, newDashboardItem);
    return data;
};

export const editDashboardItem = async (dashboardItemId: string, updatedDashboardItem: DashboardItem | TableItemToBackend) => {
    const { data } = await axios.put<MongoDashboardItem>(`${dashboard}/${dashboardItemId}`, updatedDashboardItem);
    return data;
};

export const getDashboardItemById = async (dashboardItemId: string) => {
    const { data } = await axios.get<TableItem & { _id: string }>(`${dashboard}/${dashboardItemId}`);
    return data;
};

export const deleteDashboardItem = async (dashboardItemId: string) => {
    const { data } = await axios.delete(`${dashboard}/${dashboardItemId}`);
    return data;
};

export const getDashboardItems = async (textSearch?: string) => {
    const { data } = await axios.post<MongoDashboardItemPopulated[]>(`${dashboard}/search`, { textSearch });
    return data;
};
