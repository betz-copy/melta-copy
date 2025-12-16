import { ChartsAndGenerator } from './chart';
import { IMongoIframe } from './iframe';

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

export type MongoDashboardItem = DashboardItem & MongoBaseFields;
export type MongoDashboardItemPopulated = DashboardItemPopulated & MongoBaseFields;
