import { ChartsAndGenerator, IChart } from './charts';
import { IGraphFilterBodyBatch } from './entities';
import { IFrame, IMongoIFrame } from './iFrames';

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
}

export interface TableItem {
    type: DashboardItemType.Table;
    metaData: TableMetaData;
}

interface ChartItem {
    type: DashboardItemType.Chart;
    metaData: string;
}

interface IframeItem {
    type: DashboardItemType.Iframe;
    metaData: string;
}

export type DashboardItem = TableItem | ChartItem | IframeItem;

interface ChartItemPopulated {
    type: DashboardItemType.Chart;
    metaData: ChartsAndGenerator;
}

interface IframeItemPopulated {
    type: DashboardItemType.Iframe;
    metaData: IMongoIFrame;
}

export type DashboardItemPopulated = TableItem | ChartItemPopulated | IframeItemPopulated;

export type MongoDashboardItem = DashboardItem & MongoBaseFields;
export type MongoDashboardItemPopulated = DashboardItemPopulated & MongoBaseFields;

export interface TableForm extends Omit<TableMetaData, 'filter'> {
    filter?: IGraphFilterBodyBatch;
}

export interface ChartForm extends Omit<IChart, 'filter'> {
    filter?: IGraphFilterBodyBatch;
}

export type DashboardItemData = ChartForm | IFrame | TableForm;

export enum ViewMode {
    Edit = 'edit',
    ReadOnly = 'readonly',
    Add = 'add',
}
