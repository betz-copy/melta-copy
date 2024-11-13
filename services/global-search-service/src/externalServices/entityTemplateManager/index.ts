import axios from 'axios';

import { IEntityTemplate, IMongoEntityTemplate, ISearchEntityTemplatesBody } from '@microservices/shared/src/interfaces/entityTemplate';
import config from '../../config';
import DefaultExternalService from '../../utils/externalService';

const {
    templateService: {
        url,
        entities: { baseRoute, searchTemplatesRoute },
        timeout,
    },
} = config;

export class TemplateManagerService extends DefaultExternalService {
    constructor(workspaceId: string) {
        super(workspaceId, axios.create({ baseURL: url, timeout }));
    }

    async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}): Promise<IMongoEntityTemplate[]> {
        const { data } = await this.api.post(`${baseRoute}${searchTemplatesRoute}`, body);
        return data;
    }

    async getEntityTemplateById(id: string): Promise<IEntityTemplate> {
        const { data } = await this.api.get(`${baseRoute}/${id}`);
        return data;
    }
}
