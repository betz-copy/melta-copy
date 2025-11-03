import {
    IMongoProcessInstancePopulated,
    IMongoProcessTemplatePopulated,
    IMongoStepInstance,
    IMongoStepTemplate,
    IProcessInstance,
    IProcessInstanceSearchProperties,
    IProcessTemplatePopulated,
    ISearchProcessTemplatesBody,
    PermissionScope,
    UpdateStepReqBody,
} from '@microservices/shared';
import config from '../../config';
import { NotFoundError } from '../../express/processes/error';
import { Authorizer } from '../../utils/authorizer';
import DefaultExternalServiceApi from '../../utils/express/externalService';

const {
    processService: { url, templatesBaseRoute, instancesBaseRoute, requestTimeout },
} = config;

class ProcessService extends DefaultExternalServiceApi {
    constructor(private workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout: requestTimeout });
    }

    // processes templates
    async searchProcessTemplates(body: ISearchProcessTemplatesBody) {
        const { data } = await this.api.post<IMongoProcessTemplatePopulated[]>(`${templatesBaseRoute}/search`, body);

        return data;
    }

    async getProcessTemplateById(id: string, userId?: string): Promise<IMongoProcessTemplatePopulated> {
        const query: ISearchProcessTemplatesBody = { limit: 1, skip: 0, ids: [id] };

        if (userId) {
            const userPermissions = await new Authorizer(this.workspaceId).getWorkspacePermissions(userId);

            if (!userPermissions.admin?.scope && userPermissions.processes?.scope !== PermissionScope.write) {
                query.reviewerId = userId;
            }
        }

        const [process] = await this.searchProcessTemplates(query);
        if (!process) throw new NotFoundError('process template', id);

        return process;
    }

    async createProcessTemplate(processTemplate: IProcessTemplatePopulated) {
        const { data } = await this.api.post<IMongoProcessTemplatePopulated>(templatesBaseRoute, processTemplate);

        return data;
    }

    async updateProcessTemplate(processTemplateId: string, updatedProcessTemplate: IProcessTemplatePopulated) {
        const { data } = await this.api.put<IMongoProcessTemplatePopulated>(
            `${instancesBaseRoute}/template/${processTemplateId}`,
            updatedProcessTemplate,
        );

        return data;
    }

    async deleteProcessTemplate(processTemplateId: string) {
        const { data } = await this.api.delete<IMongoProcessTemplatePopulated>(`${templatesBaseRoute}/${processTemplateId}`);

        return data;
    }

    // Process Instance
    async getProcessInstanceById(id: string, userId?: string): Promise<IMongoProcessInstancePopulated> {
        const query: IProcessInstanceSearchProperties = { limit: 1, skip: 0, ids: [id] };

        if (userId) {
            const userPermissions = await new Authorizer(this.workspaceId).getWorkspacePermissions(userId);

            if (!userPermissions.admin?.scope && userPermissions.processes?.scope !== PermissionScope.write) {
                query.reviewerId = userId;
            }
        }

        const [process] = await this.searchProcessInstances(query);

        if (!process) throw new NotFoundError('process', id);

        return process;
    }

    async createProcessInstance(processData: IProcessInstance, userId: string) {
        const { data } = await this.api.post<IMongoProcessInstancePopulated>(`${instancesBaseRoute}`, { ...processData, userId });
        return data;
    }

    async updateProcessInstance(id: string, processData: IProcessInstance, userId: string) {
        const { data } = await this.api.put<IMongoProcessInstancePopulated>(`${instancesBaseRoute}/${id}`, { ...processData, userId });
        return data;
    }

    async archivedProcess(id: string, archived: boolean) {
        const { data } = await this.api.patch<IMongoProcessInstancePopulated>(`${instancesBaseRoute}/archive/${id}`, { archived });

        return data;
    }

    async deleteProcessInstance(id: string) {
        const { data } = await this.api.delete<IMongoProcessInstancePopulated>(`${instancesBaseRoute}/${id}`);
        return data;
    }

    async searchProcessInstances(body: IProcessInstanceSearchProperties) {
        const { data } = await this.api.post<IMongoProcessInstancePopulated[]>(`${instancesBaseRoute}/search`, body);

        return data;
    }

    async deletePropertiesOfTemplate(
        templateId: string,
        removedProperties: {
            processProperties: string[];
            stepsProperties: Record<string, string[]>;
        },
        currentTemplate: IMongoProcessTemplatePopulated,
    ) {
        const { data } = await this.api.patch<IMongoProcessInstancePopulated[]>(`${instancesBaseRoute}/deletePropertiesOfTemplate/${templateId}`, {
            removedProperties,
            currentTemplate,
        });

        return data;
    }

    // Step Instance
    async getStepInstanceById(id: string) {
        const { data } = await this.api.get<IMongoStepInstance>(`${instancesBaseRoute}/steps/${id}`);
        return data;
    }

    async getStepTemplateByStepInstanceId(id: string) {
        const { data } = await this.api.get<IMongoStepTemplate>(`${instancesBaseRoute}/steps/${id}/step-template`);
        return data;
    }

    async updateStepInstance(id: string, updatedStep: UpdateStepReqBody, userId: string) {
        const { data } = await this.api.patch<IMongoStepInstance>(`${instancesBaseRoute}/steps/${id}`, { ...updatedStep, userId });
        return data;
    }
}

export default ProcessService;
