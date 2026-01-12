import { ISearchFilter } from '@packages/entity';

export enum IChartType {
    Column = 'column',
    Line = 'line',
    Pie = 'pie',
    Number = 'number',
}

export enum IAggregationType {
    CountAll = 'countAll',
    CountDistinct = 'countDistinct',
    Average = 'average',
    Sum = 'sum',
    Maximum = 'maximum',
    Minimum = 'minimum',
    None = 'none',
}

export interface IAggregation {
    type: IAggregationType;
    byField?: string;
}

export type IAxisField = IAggregation | string;

export interface IAxis {
    field: IAxisField;
    title: string;
}

export interface IColumnOrLineMetaData {
    xAxis: IAxis;
    yAxis: IAxis;
}

export interface IPieMetaData {
    dividedByField: string;
    aggregationType: IAggregation;
}

export interface INumberMetaData {
    accumulator: IAxisField;
}

export type IChartTypeMetaData = IColumnOrLineMetaData | IPieMetaData | INumberMetaData;

export enum IChartPermission {
    Protected = 'protected',
    Private = 'private',
}

export interface IChart {
    name: string;
    description: string;
    type: IChartType;
    metaData: IChartTypeMetaData;
    permission: IChartPermission;
    filter?: string;
    templateId: string;
    childTemplateId?: string;
    createdBy: string;
    usedInDashboard?: boolean;
}

export interface IMongoChart extends IChart {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface IChartBody {
    _id: string;
    xAxis: IAxisField;
    yAxis?: IAxisField;
    filter: ISearchFilter;
}

export enum OptionsType {
    Aggregation = 'aggregation',
    AllProperties = 'allProperties',
    NumberProperties = 'numberProperties',
    AggregationAndNumberProperties = 'aggregationAndNumberProperties',
    AggregationAndAllProperties = 'aggregationAndAllProperties',
}

export type GeneratorChart = { x: IPropertyValue; y: number }[];

export interface ChartsAndGenerator extends IMongoChart {
    chart: GeneratorChart;
}
