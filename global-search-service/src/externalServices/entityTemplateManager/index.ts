import { IEntityTemplate, IMongoEntityTemplate, ISearchEntityTemplatesBody } from '@packages/entity-template';
import axios from 'axios';
import config from '../../config';
import DefaultExternalService from '../../utils/externalService';

const {
    url,
    entities: { baseRoute, searchTemplatesRoute },
    timeout,
} = config.templateService;

class TemplateManagerService extends DefaultExternalService {
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

export default TemplateManagerService;
