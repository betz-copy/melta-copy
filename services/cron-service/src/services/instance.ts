import { ISearchEntitiesOfTemplateBody, ISearchResult, ISearchSort, IMongoRelationshipTemplate } from '@microservices/shared';
import config from '../config';
import DefaultExternalServiceApi from '../utils/express/externalService';

const {
    instanceService: { url, baseEntitiesRoute, requestTimeout, searchOfTemplateRoute },
} = config;

export type ISearchEntitiesOfTemplateBodyOptional = Omit<ISearchEntitiesOfTemplateBody, 'skip' | 'sort' | 'showRelationships'> & {
    skip?: number;
    showRelationships?: boolean | Array<IMongoRelationshipTemplate['_id']>;
    sort?: ISearchSort;
};

export class InstancesService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout: requestTimeout });
    }

    async searchEntitiesOfTemplateRequest(templateId: string, searchBody: ISearchEntitiesOfTemplateBodyOptional) {
        const { data } = await this.api.post<ISearchResult>(`${baseEntitiesRoute}${searchOfTemplateRoute}/${templateId}`, searchBody);

        return data;
    }
}
