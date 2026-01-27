import { ChartsAndGenerator } from '@packages/chart';
import { IMongoProps } from '@packages/common';
import { IMongoIframe } from '@packages/iframe';

export enum DashboardItemType {
    Table = 'table',
    Chart = 'chart',
    Iframe = 'iframe',
}
export interface TableMetaData {
    _id?: string;
    templateId: string;
    name: string;
    description: string;
    columns: string[];
    filter?: string;
    childTemplateId?: string;
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
    metaData: ChartsAndGenerator;
}

interface IframeItemPopulated {
    type: DashboardItemType.Iframe;
    metaData: IMongoIframe;
}

export type DashboardItemPopulated = TableItem | ChartItemPopulated | IframeItemPopulated;

export type MongoDashboardItem = DashboardItem & IMongoProps;
export type MongoDashboardItemPopulated = DashboardItemPopulated & IMongoProps;
