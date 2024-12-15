enum IChartType {
    Bar = 'bar',
    Line = 'line',
    Pie = 'pie',
    Number = 'number',
}

interface IAggregation {
    type: 'countAll' | 'countDistinct' | 'average' | 'sum' | 'maximum' | 'minimum';
    byField?: string;
}

type IAxisField = IAggregation | string;

interface IAxis {
    field: IAxisField;
    title: string;
}

interface IBarOrLineMetaData {
    xAxis: IAxis;
    yAxis: IAxis;
}

interface ILineMetaData {}

interface IPieMetaData {
    dividedByField: string;
    aggregationType: IAggregation;
}

interface INUmberMetaData {
    accumulator: IAxisField;
    filterField: {
        field: string;
        displayName: string;
    };
}

export type IChartTypeMetaData = IBarOrLineMetaData | ILineMetaData | IPieMetaData | INUmberMetaData;

enum IChartPermission {
    Read = 'read',
    Write = 'write',
}

export interface IChart {
    name: string;
    description: string;
    templateId: string;
    type: IChartType;
    typeMetaData: IChartTypeMetaData;
    filters: any;
    color: string;
    createdBy: string;
    permission: IChartPermission;
    permissionMetadata?: Record<string, IChartPermission>;
    tooltipFields: string[];
}

export interface IChartDocument extends IChart {
    _id: string;
}
