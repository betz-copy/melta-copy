import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';

const {
    ganttService: { url, baseRoute, requestTimeout },
} = config;

export interface IGanttItem {
    entityTemplate: {
        id: string;
        startDateField: string;
        endDateField: string;
        fieldsToShow: string[];
    };
    connectedEntityTemplates: {
        relationshipTemplateId: string;
        fieldsToShow: string[];
    }[];
    groupByRelationshipId?: string; // must exist if gantt has groupBy
}

export interface IGantt {
    name: string;
    items: IGanttItem[];
    groupBy?: {
        entityTemplateId: string;
        groupNameField: string; // must be unique
    };
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
    entityTemplateId?: string;
    relationshipTemplateIds?: string[];
}
export class GanttsService extends DefaultExternalServiceApi {
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
