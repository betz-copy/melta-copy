export enum IChartType {
    Bar = 'bar',
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

type IAxisField = IAggregation | string;

export interface IAxis {
    field: IAxisField;
    title: string;
}

export interface IBarOrLineMetaData {
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

export type IChartTypeMetaData = IBarOrLineMetaData | IPieMetaData | INUmberMetaData;

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
    color: string;
    tooltipFields: string[];
}

export interface IChartDocument extends IChart {
    _id: string;
}
