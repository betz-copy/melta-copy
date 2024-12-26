export interface IBasicChart {
    name: string;
    description: string;
    type: IChartType;
    xAxis: IAxis;
    yAxis: IAxis;
    permission: IPermission;
}

export interface IChart extends IBasicChart {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum IChartType {
    Bar = 'bar',
    Line = 'line',
    Pie = 'pie',
    Number = 'number',
}

export interface IAggregation {
    type: 'countAll' | 'countDistinct' | 'average' | 'sum' | 'maximum' | 'minimum';
    byField?: string;
}

export type IAxisField = IAggregation | string;

export interface IAxis {
    field: IAxisField;
    title: string;
}

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
