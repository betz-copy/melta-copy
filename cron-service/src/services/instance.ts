import config from '../config';
import { IAction, IBrokenRule } from '../instance/action/interface';
import { IEntity, ISearchEntitiesOfTemplateBody, ISearchResult } from '../instance/entity/interface';
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

    async searchEntitiesWithUserFields() {
        const { data } = await this.api.post<IEntity[]>(`${baseEntitiesRoute}/searchByUserField`);

        return data;
    }

    async updateEntityInstance(id: string, entity: IEntity, ignoredRules: IBrokenRule[], userId: string, convertToRelationshipField = false) {
        const { data } = await this.api.put<{ updatedEntity: IEntity; actions?: IAction[] }>(`${baseEntitiesRoute}/${id}`, {
            ...entity,
            ignoredRules,
            userId,
            convertToRelationshipField,
        });

        return data;
    }

    async getEntityInstancesByIds(ids: string[]) {
        const { data } = await this.api.post<IEntity[]>(`${baseEntitiesRoute}/ids`, { ids });
    
        return data;
    }
}
