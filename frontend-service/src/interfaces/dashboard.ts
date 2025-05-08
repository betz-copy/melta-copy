import { IChart } from './charts';
import { IGraphFilterBodyBatch } from './entities';
import { IFrame } from './iFrames';

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
    name: string;
    description: string;
    columns: string[];
    columnsOrder: string[];
    filter?: IGraphFilterBodyBatch;
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
}

export interface ChartDashboardItem extends DashboardItemBase {
    type: DashboardItemType.Chart;
    metaData: ChartMetaData;
}

export interface ChartDashboardItemPopulated extends DashboardItemBase {
    type: DashboardItemType.Chart;
    metaData: IChart;
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

export type DashboardItemPopulated = ChartDashboardItemPopulated | IframeDashboardItem | TableDashboardItem;

export type DashboardItemData = IFrame | IChart | TableMetaData;

export const isChartItem = ({ type }: DashboardItem) => type === DashboardItemType.Chart;

export const isIframeItem = ({ type }: DashboardItem) => type === DashboardItemType.Iframe;

export const isTableItem = ({ type }: DashboardItem) => type === DashboardItemType.Table;
