import {
    IAction,
    IBrokenRule,
    IEntity,
    IEntityWithDirectRelationships,
    ISearchEntitiesByTemplatesBody,
    ISearchEntitiesOfTemplateBody,
    ISearchResult,
} from '@microservices/shared';
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

    async searchEntitiesByTemplatesRequest(searchBodyByTemplates: ISearchEntitiesByTemplatesBody) {
        const { data } = await this.api.post<{
            [templateId: string]: {
                entities: IEntityWithDirectRelationships[];
                count: number;
            };
        }>(`${baseEntitiesRoute}/search/templates`, searchBodyByTemplates);

        return data;
    }

    async updateEntityInstance(id: string, entity: IEntity, ignoredRules: IBrokenRule[], convertToRelationshipField = false) {
        const { data } = await this.api.put<{ updatedEntity: IEntity; actions?: IAction[] }>(`${baseEntitiesRoute}/${id}`, {
            ...entity,
            ignoredRules,
            convertToRelationshipField,
        });

        return data;
    }

    async getEntityInstancesByIds(ids: string[]) {
        const { data } = await this.api.post<IEntity[]>(`${baseEntitiesRoute}/ids`, { ids });

        return data;
    }
}

export default InstancesService;
