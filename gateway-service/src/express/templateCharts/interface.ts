
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

interface IAggregation {
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

export interface INUmberMetaData {
    accumulator: IAxisField;
}

export type IChartTypeMetaData = IColumnOrLineMetaData | IPieMetaData | INUmberMetaData;

export enum IPermission {
    Protected = 'protected',
    Private = 'private',
}

export interface IChart {
    name: string;
    description: string;
    templateId: string;
    type: IChartType;
    metaData: IChartTypeMetaData;
    filter: any;
    createdBy: string;
    permission: IPermission;
    color?: string;
}

export interface IChartDocument extends IChart {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface IChartBody {
    _id: string;
    xAxis: IAxisField;
    yAxis?: IAxisField;
    filter: string;
}

type GeneratorChart = { x: any; y: any }[];

export interface ChartsAndGenerator extends IChartDocument {
    chart: GeneratorChart;
}
