import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';
import { IChart } from './chartService';
import { IFrame } from './iframesService';

const {
    dashboardService: { url, baseRoute, requestTimeout, dashboard },
} = config;

export enum DashboardItemType {
    Table = 'table',
    Chart = 'chart',
    Iframe = 'iframe',
}
export interface MongoBaseFields {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface TableMetaData {
    templateId: string;
    columns: string[];
    columnsOrder: string[];
    filters: string;
}

export interface TableItem {
    type: DashboardItemType.Table;
    metaData: TableMetaData;
}

export interface ChartItem {
    type: DashboardItemType.Chart;
    metaData: string;
}

export interface IframeItem {
    type: DashboardItemType.Iframe;
    metaData: string;
}

export type DashboardItem = TableItem | ChartItem | IframeItem;

export interface ChartItemPopulated {
    type: DashboardItemType.Chart;
    metaData: IChart;
}

export interface IframeItemPopulated {
    type: DashboardItemType.Iframe;
    metaData: IFrame;
}

export type DashboardItemPopulated = TableItem | ChartItemPopulated | IframeItemPopulated;

export type MongoDashboardItem = DashboardItem & MongoBaseFields;
export type MongoDashboardItemPopulated = DashboardItemPopulated & MongoBaseFields;

export class DashboardItemService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}${dashboard.baseRoute}`, timeout: requestTimeout });
    }

    async createDashboardItem(dashboardItem: DashboardItem): Promise<DashboardItem> {
        const { data } = await this.api.post('/', dashboardItem);
        return data;
    }

    async searchDashboardItems(textSearch?: string) {
        const { data } = await this.api.post<DashboardItem[]>('/search', { textSearch });
        return data;
    }
}
