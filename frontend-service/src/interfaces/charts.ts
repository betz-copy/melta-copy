export interface IChart {
    name: string;
    description: string;
    type: IChartType;
    metaData: IChartTypeMetaData;
    permission: IPermission;
    filter?: string;
    templateId: string;
    createdBy: string;
    usedInDashboard?: boolean;
}

export interface IMongoChart extends IChart {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

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
    Minimum = 'minimum',
    Maximum = 'maximum',
}

export interface IAggregation {
    type: IAggregationType;
    byField?: string;
}

export type IAxisField = IAggregation | string;

export interface IAxis {
    title: string;
    field: IAxisField;
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
    accumulator: IAggregation;
}

export type IChartTypeMetaData = IColumnOrLineMetaData | IPieMetaData | INumberMetaData;

export enum IPermission {
    Protected = 'protected',
    Private = 'private',
}

export enum Axises {
    X = 'x',
    Y = 'y',
}

export enum OptionsType {
    Aggregation = 'aggregation',
    AllProperties = 'allProperties',
    NumberProperties = 'numberProperties',
    AggregationAndNumberProperties = 'aggregationAndNumberProperties',
    AggregationAndAllProperties = 'aggregationAndAllProperties',
}

export type HighchartType = Exclude<IChartType, IChartType.Number>;

export const isAggregation = (field: IAxisField): field is IAggregation => typeof field !== 'string';

export type GeneratedChart = { x: any; y: number }[];

export interface ChartsAndGenerator extends IMongoChart {
    chart: GeneratedChart;
}
