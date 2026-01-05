import { IChart, IMongoChart } from '@packages/chart';
import { ISearchFilter } from '@packages/entity';
import config from '../../config';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const {
    dashboardService: { url, baseRoute, requestTimeout, charts },
} = config;

class ChartService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}${charts.baseRoute}`, timeout: requestTimeout });
    }

    async getChartsByTemplateId(templateId: string, textSearch?: string, childTemplateId?: string, filters?: ISearchFilter): Promise<IMongoChart[]> {
        const { data } = await this.api.post<IMongoChart[]>(`/by-template/${templateId}`, { textSearch, childTemplateId, filters });
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

export default ChartService;
