import config from '../../config';
import { IMongoProcessInstanceWithSteps, IProcessInstance, ISearchProcessInstancesBody } from './interfaces/processInstance';
import { IMongoProcessTemplateWithSteps, IProcessTemplateWithSteps, ISearchProcessTemplatesBody } from './interfaces/processTemplate';
import { IMongoStepInstance, UpdateStepReqBody } from './interfaces/stepInstance';
import { IMongoStepTemplate } from './interfaces/stepTemplate';
import { NotFoundError } from '../../express/processes/error';
import DefaultExternalServiceApi from '../../utils/express/externalService';
import { UserService } from '../userService';
import { PermissionScope } from '../userService/interfaces/permissions';

const {
    processService: { url, templatesBaseRoute, instancesBaseRoute, requestTimeout },
} = config;

export class ProcessService extends DefaultExternalServiceApi {
    constructor(private workspaceId: string) {
        super(workspaceId, { baseURL: url, timeout: requestTimeout });
    }

    // processes templates
    async searchProcessTemplates(body: ISearchProcessTemplatesBody) {
        const { data } = await this.api.post<IMongoProcessTemplateWithSteps[]>(`${templatesBaseRoute}/search`, body);

        return data;
    }

    async getProcessTemplateById(id: string, userId?: string): Promise<IMongoProcessTemplateWithSteps> {
        const query: ISearchProcessTemplatesBody = { limit: 1, skip: 0, ids: [id] };

        if (userId) {
            const userPermissions = await UserService.getUserPermissions(userId);

            if (userPermissions[this.workspaceId].processes?.scope !== PermissionScope.write) {
                query.reviewerId = userId;
            }
        }

        const [process] = await this.searchProcessTemplates(query);
        if (!process) throw new NotFoundError('process template', id);

        return process;
    }

    async createProcessTemplate(processTemplate: IProcessTemplateWithSteps) {
        const { data } = await this.api.post<IMongoProcessTemplateWithSteps>(templatesBaseRoute, processTemplate);

        return data;
    }

    async updateProcessTemplate(processTemplateId: string, updatedProcessTemplate: IProcessTemplateWithSteps) {
        const { data } = await this.api.put<IMongoProcessTemplateWithSteps>(`${templatesBaseRoute}/${processTemplateId}`, updatedProcessTemplate);

        return data;
    }

    async deleteProcessTemplate(processTemplateId: string) {
        const { data } = await this.api.delete<IMongoProcessTemplateWithSteps>(`${templatesBaseRoute}/${processTemplateId}`);

        return data;
    }

    // Process Instance
    async getProcessInstanceById(id: string, userId?: string): Promise<IMongoProcessInstanceWithSteps> {
        const query: ISearchProcessInstancesBody = { limit: 1, skip: 0, ids: [id] };

        if (userId) {
            const userPermissions = await UserService.getUserPermissions(userId);

            if (userPermissions[this.workspaceId].processes?.scope !== PermissionScope.write) {
                query.reviewerId = userId;
            }
        }

        const [process] = await this.searchProcessInstances(query);

        if (!process) throw new NotFoundError('process', id);

        return process;
    }

    async createProcessInstance(processData: IProcessInstance) {
        const { data } = await this.api.post<IMongoProcessInstanceWithSteps>(`${instancesBaseRoute}`, processData);
        return data;
    }

    async updateProcessInstance(id: string, processData: IProcessInstance) {
        const { data } = await this.api.put<IMongoProcessInstanceWithSteps>(`${instancesBaseRoute}/${id}`, processData);
        return data;
    }

    async archivedProcess(id: string, archived: Boolean) {
        const { data } = await this.api.patch<IMongoProcessInstanceWithSteps>(`${instancesBaseRoute}/archive/${id}`, { archived });

        return data;
    }

    async deleteProcessInstance(id: string) {
        const { data } = await this.api.delete<IMongoProcessInstanceWithSteps>(`${instancesBaseRoute}/${id}`);
        return data;
    }

    async searchProcessInstances(body: ISearchProcessInstancesBody) {
        const { data } = await this.api.post<IMongoProcessInstanceWithSteps[]>(`${instancesBaseRoute}/search`, body);

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

    async updateStepInstance(id: string, updatedStep: UpdateStepReqBody) {
        const { data } = await this.api.patch<IMongoStepInstance>(`${instancesBaseRoute}/steps/${id}`, updatedStep);
        return data;
    }
}
