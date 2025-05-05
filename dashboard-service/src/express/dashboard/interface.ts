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
    templateId: string;
    columns: string[];
    columnsOrder: string[];
    filters: string;
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
    permission: IPermission;
    createdBy: string;
}

export interface ChartDashboardItem extends DashboardItemBase {
    type: DashboardItemType.Chart;
    metaData: ChartMetaData;
}

export interface IframeDashboardItem extends DashboardItemBase {
    type: DashboardItemType.Iframe;
    metaData: IframeMetaData;
}

export interface TableDashboardItem extends DashboardItemBase {
    type: DashboardItemType.Table;
    metaData: TableMetaData;
}

export type DashboardItem = ChartDashboardItem | IframeDashboardItem | TableDashboardItem;

export const isChartItem = ({ type }: DashboardItem) => type === DashboardItemType.Chart;

export const isIframeItem = ({ type }: DashboardItem) => type === DashboardItemType.Iframe;

export const isTableItem = ({ type }: DashboardItem) => type === DashboardItemType.Table;
