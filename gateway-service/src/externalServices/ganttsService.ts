import axios from 'axios';
import config from '../config';

const {
    ganttsService: { uri, baseRoute, requestTimeout },
} = config;

export interface IGanttItem {
    entityTemplate: {
        id: string;
        startDateField: string;
        endDateField: string;
        fieldsToShow: string[];
    };
    connectedEntityTemplate?: {
        relationshipTemplateId: string;
        fieldsToShow: string[];
    };
}

export interface IGantt {
    name: string;
    items: IGanttItem[];
}

export interface IMongoGantt extends IGantt {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ISearchGanttsBody {
    search?: string;
    limit: number;
    step: number;
}

export class GanttsService {
    private static ganttsServiceApi = axios.create({ baseURL: uri, timeout: requestTimeout });

    static async searchGantts(searchBody: ISearchGanttsBody) {
        const { data } = await this.ganttsServiceApi.post<IMongoGantt[]>(`${baseRoute}/search`, searchBody);
        return data;
    }

    static async getGanttById(ganttId: string) {
        const { data } = await this.ganttsServiceApi.get<IMongoGantt>(`${baseRoute}/${ganttId}`);
        return data;
    }

    static async createGantt(gantt: IGantt) {
        const { data } = await this.ganttsServiceApi.post<IMongoGantt>(baseRoute, gantt);
        return data;
    }

    static async deleteGantt(ganttId: string) {
        const { data } = await this.ganttsServiceApi.delete<IMongoGantt>(`${baseRoute}/${ganttId}`);
        return data;
    }

    static async updateGantt(ganttId: string, gantt: IGantt) {
        const { data } = await this.ganttsServiceApi.put<IMongoGantt>(`${baseRoute}/${ganttId}`, gantt);
        return data;
    }
}
