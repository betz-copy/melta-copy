import axios from 'axios';

import config from '../../config';
import { IEntityTemplate, ISearchEntityTemplatesBody } from './interfaces';

const { templateManager } = config;
const { url, baseRoute, searchTemplatesRoute, timeout } = templateManager;

export class EntityTemplateManagerService {
    private static EntityTemplateManagerApi = axios.create({ baseURL: url, timeout });

    static async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.EntityTemplateManagerApi.post<IEntityTemplate[]>(`${baseRoute}${searchTemplatesRoute}`, body);

        return data;
    }

    static async getEntityTemplateById(id: string) {
        const { data } = await this.EntityTemplateManagerApi.get<IEntityTemplate>(`${baseRoute}/${id}`);

        return data;
    }
}
