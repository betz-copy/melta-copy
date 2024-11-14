import config from '../config';
import { ISearchEntitiesOfTemplateBody, ISearchResult } from '@microservices/shared/src/interfaces/entity';
import DefaultExternalServiceApi from '../utils/express/externalService';

const {
    instanceService: { url, baseEntitiesRoute, requestTimeout, searchOfTemplateRoute },
} = config;

export class InstancesService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout: requestTimeout });
    }

    async searchEntitiesOfTemplateRequest(templateId: string, searchBody: ISearchEntitiesOfTemplateBody) {
        const { data } = await this.api.post<ISearchResult>(`${baseEntitiesRoute}${searchOfTemplateRoute}/${templateId}`, searchBody);

        return data;
    }
}
