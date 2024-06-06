import axios from 'axios';

import config from '../../config';
import DefaultExternalService from '../../utils/externalService';
import { IEntityTemplate, ISearchEntityTemplatesBody } from './interfaces';

const {
    entityTemplateService: { url, baseRoute, searchTemplatesRoute, timeout },
} = config;

export class EntityTemplateManagerService extends DefaultExternalService {
    constructor(dbName: string) {
        super(dbName, axios.create({ baseURL: url, timeout }));
    }

    async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.api.post<IEntityTemplate[]>(`${baseRoute}${searchTemplatesRoute}`, body);

        return data;
    }

    async getEntityTemplateById(id: string) {
        const { data } = await this.api.get<IEntityTemplate>(`${baseRoute}/${id}`);

        return data;
    }
}
