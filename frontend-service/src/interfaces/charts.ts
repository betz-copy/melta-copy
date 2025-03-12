export interface IBasicChart {
    name: string;
    description: string;
    type: IChartType;
    metaData: IChartTypeMetaData;
    permission: IPermission;
    filter?: string;
    templateId?: string;
    createdBy?: string;
}

export interface IChart extends IBasicChart {
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
    Maximum = 'maximum',
    Minimum = 'minimum',
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

export interface INUmberMetaData {
    accumulator: IAggregation;
}

export type IChartTypeMetaData = IColumnOrLineMetaData | IPieMetaData | INUmberMetaData;

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

type GeneratorChart = { x: any; y: any }[];

export interface ChartsAndGenerator extends IChart {
    chart: GeneratorChart;
}
