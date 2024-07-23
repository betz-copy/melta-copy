import axios from 'axios';

import config from '../../config';
import DefaultExternalService from '../../utils/externalService';
import { IEntityTemplate, ISearchEntityTemplatesBody } from './interfaces';

const {
    templateService: {
        url,
        entities: { baseRoute, searchTemplatesRoute },
        timeout,
    },
} = config;

export class TemplateManagerService extends DefaultExternalService {
    constructor(dbName: string) {
        super(dbName, axios.create({ baseURL: url, timeout }));
    }

    async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}): Promise<IEntityTemplate[]> {
        const { data } = await this.api.post(`${baseRoute}${searchTemplatesRoute}`, body);
        return data;
    }

    async getEntityTemplateById(id: string): Promise<IEntityTemplate> {
        const { data } = await this.api.get(`${baseRoute}/${id}`);
        return data;
    }
}
