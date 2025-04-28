import { ISearchEntitiesOfTemplateBody, ISearchResult } from '@microservices/shared';
import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';

const {
    instanceService: { url, baseEntitiesRoute, requestTimeout, searchOfTemplateRoute },
} = config;

class InstancesService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout: requestTimeout });
    }

    async searchEntitiesOfTemplateRequest(templateId: string, searchBody: ISearchEntitiesOfTemplateBody) {
        const { data } = await this.api.post<ISearchResult>(`${baseEntitiesRoute}${searchOfTemplateRoute}/${templateId}`, searchBody);

        return data;
    }
}

export default InstancesService;
