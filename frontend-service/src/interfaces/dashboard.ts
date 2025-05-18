import { IChart } from './charts';
import { IGraphFilterBodyBatch } from './entities';
import { IFrame } from './iFrames';

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
    name: string;
    description: string;
    columns: string[];
    columnsOrder: string[];
    filter?: IGraphFilterBodyBatch;
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

export enum ViewMode {
    Edit = 'edit',
    ReadOnly = 'readonly',
    Add = 'add',
}

export const isChartItem = ({ type }: DashboardItem) => type === DashboardItemType.Chart;

export const isIframeItem = ({ type }: DashboardItem) => type === DashboardItemType.Iframe;

export const isTableItem = ({ type }: DashboardItem) => type === DashboardItemType.Table;

export type DashboardItemData = IChart | IFrame | TableMetaData;
