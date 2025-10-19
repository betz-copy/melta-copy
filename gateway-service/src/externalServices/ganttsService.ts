import { IGantt, IMongoGantt, ISearchGanttsBody } from '@microservices/shared';
import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';

const {
    ganttService: { url, baseRoute, requestTimeout },
} = config;

class GanttsService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}`, timeout: requestTimeout });
    }

    async searchGantts(searchBody: ISearchGanttsBody) {
        const { data } = await this.api.post<IMongoGantt[]>('/search', searchBody);
        return data;
    }

    async getGanttById(ganttId: string) {
        const { data } = await this.api.get<IMongoGantt>(`/${ganttId}`);
        return data;
    }

    async createGantt(gantt: IGantt) {
        const { data } = await this.api.post<IMongoGantt>('/', gantt);
        return data;
    }

    async deleteGantt(ganttId: string) {
        const { data } = await this.api.delete<IMongoGantt>(`/${ganttId}`);
        return data;
    }

    async updateGantt(ganttId: string, gantt: IGantt) {
        const { data } = await this.api.put<IMongoGantt>(`/${ganttId}`, gantt);
        return data;
    }
}

export default GanttsService;
