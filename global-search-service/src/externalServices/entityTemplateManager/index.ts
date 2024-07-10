import axios from 'axios';

import config from '../../config';
import { IEntityTemplate, ISearchEntityTemplatesBody } from './interfaces';

const {
    templateService: {
        url,
        entities: { baseRoute, searchTemplatesRoute },
        timeout,
    },
} = config;

export class TemplateManagerService {
    private static TemplateManagerApi = axios.create({ baseURL: url, timeout });

    static async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.TemplateManagerApi.post<IEntityTemplate[]>(`${baseRoute}${searchTemplatesRoute}`, body);

        return data;
    }

    static async getEntityTemplateById(id: string) {
        const { data } = await this.TemplateManagerApi.get<IEntityTemplate>(`${baseRoute}/${id}`);

        return data;
    }
}
