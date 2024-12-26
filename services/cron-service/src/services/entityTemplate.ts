import { IEntityTemplatePopulated, ISearchEntityTemplatesBody } from '@microservices/shared';
import config from '../config';
import TemplatesManagerService from './template';

const {
    templateService: {
        entities: { baseEntitiesRoute },
    },
} = config;

class EntityTemplateService extends TemplatesManagerService {
    async searchEntityTemplates(body: ISearchEntityTemplatesBody = {}) {
        const { data } = await this.api.post<IEntityTemplatePopulated[]>(`${baseEntitiesRoute}/search`, body);

        return data;
    }
}

export default EntityTemplateService;
