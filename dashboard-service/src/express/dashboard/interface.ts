export enum DashboardItemType {
    Iframe = 'iframe',
    Chart = 'chart',
    Table = 'table',
}

export enum IPermission {
    Protected = 'protected',
    Private = 'private',
}

export interface TableMetaData {
    name: string;
    description: string;
    templateId: string;
    columns: string[];
    columnsOrder: string[];
    filter?: string;
}

export interface IframeMetaData {
    iframeId: string;
}

export interface ChartMetaData {
    chartId: string;
}

export interface DashboardItemBase {
    _id: string;
    type: DashboardItemType;
    // permission: IPermission;
    // createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChartDashboardItem extends DashboardItemBase {
    type: DashboardItemType.Chart;
    metaData: string;
}

export interface IframeDashboardItem extends DashboardItemBase {
    type: DashboardItemType.Iframe;
    metaData: string;
}

export interface TableDashboardItem extends DashboardItemBase {
    type: DashboardItemType.Table;
    metaData: TableMetaData;
}

export type DashboardItem = ChartDashboardItem | IframeDashboardItem | TableDashboardItem;

export const isChartItem = ({ type }: DashboardItem) => type === DashboardItemType.Chart;

export const isIframeItem = ({ type }: DashboardItem) => type === DashboardItemType.Iframe;

export const isTableItem = ({ type }: DashboardItem) => type === DashboardItemType.Table;
