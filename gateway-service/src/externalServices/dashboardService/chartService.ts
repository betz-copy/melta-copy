import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const {
    dashboardService: { url, baseRoute, requestTimeout, charts },
} = config;

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
    filter?: string;
    createdBy: string;
    permission: IPermission;
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
    filter: string;
}

type GeneratorChart = { x: any; y: number }[];

export interface ChartsAndGenerator extends IMongoChart {
    chart: GeneratorChart;
    usedInDashboard?: boolean;
}

export class ChartService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}${charts.baseRoute}`, timeout: requestTimeout });
    }

    async getChartsByTemplateId(templateId: string, textSearch?: string): Promise<IMongoChart[]> {
        const { data } = await this.api.post<IMongoChart[]>(`/by-template/${templateId}`, { textSearch });
        return data;
    }

    async getChartById(chartId: string): Promise<IMongoChart> {
        const { data } = await this.api.get<IMongoChart>(`/${chartId}`);
        return data;
    }

    async createChart(chart: IChart): Promise<IMongoChart> {
        const { data } = await this.api.post('/', chart);
        return data;
    }

    async updateChart(chartId: string, chart: IChart): Promise<IMongoChart> {
        const { data } = await this.api.put(`/${chartId}`, chart);
        return data;
    }

    async deleteChart(chartId: string): Promise<IMongoChart> {
        const { data } = await this.api.delete(`/${chartId}`);
        return data;
    }
}
