import axios from 'axios';
import config from '../../config';
import { IMongoProcessInstanceWithSteps, IProcessInstance, ISearchProcessInstancesBody } from './interfaces/processInstance';
import { IMongoProcessTemplateWithSteps, IProcessTemplateWithSteps, ISearchProcessTemplatesBody } from './interfaces/processTemplate';
import { IMongoStepInstance, UpdateStepReqBody } from './interfaces/stepInstance';
import { IMongoStepTemplate } from './interfaces/stepTemplate';
import { isProcessManager } from '../permissionsService';
import { NotFoundError } from '../../express/processes/error';

const {
    processService: { url, templatesBaseRoute, instancesBaseRoute, requestTimeout },
} = config;

export class ProcessManagerService {
    private static processServiceManagerApi = axios.create({ baseURL: url, timeout: requestTimeout });

    // processes templates
    static async searchProcessTemplates(body: ISearchProcessTemplatesBody) {
        const { data } = await ProcessManagerService.processServiceManagerApi.post<IMongoProcessTemplateWithSteps[]>(
            `${templatesBaseRoute}/search`,
            body,
        );

        return data;
    }

    static async getProcessTemplateById(id: string, userId?: string): Promise<IMongoProcessTemplateWithSteps> {
        const query: ISearchProcessTemplatesBody = { limit: 1, skip: 0, ids: [id] };

        if (userId && !(await isProcessManager(userId))) query.reviewerId = userId;

        const [process] = await ProcessManagerService.searchProcessTemplates(query);
        if (!process) throw new NotFoundError('process template', id);

        return process;
    }

    static async createProcessTemplate(processTemplate: IProcessTemplateWithSteps) {
        const { data } = await ProcessManagerService.processServiceManagerApi.post<IMongoProcessTemplateWithSteps>(
            templatesBaseRoute,
            processTemplate,
        );

        return data;
    }

    static async updateProcessTemplate(processTemplateId: string, updatedProcessTemplate: IProcessTemplateWithSteps) {
        const { data } = await ProcessManagerService.processServiceManagerApi.put<IMongoProcessTemplateWithSteps>(
            `${templatesBaseRoute}/${processTemplateId}`,
            updatedProcessTemplate,
        );

        return data;
    }

    static async deleteProcessTemplate(processTemplateId: string) {
        const { data } = await ProcessManagerService.processServiceManagerApi.delete<IMongoProcessTemplateWithSteps>(
            `${templatesBaseRoute}/${processTemplateId}`,
        );

        return data;
    }

    // Process Instance
    static async getProcessInstanceById(id: string, userId?: string): Promise<IMongoProcessInstanceWithSteps> {
        const query: ISearchProcessInstancesBody = { limit: 1, skip: 0, ids: [id] };
        if (userId && !(await isProcessManager(userId))) query.reviewerId = userId;
        const [process] = await ProcessManagerService.searchProcessInstances(query);

        if (!process) throw new NotFoundError('process', id);

        return process;
    }

    static async createProcessInstance(processData: IProcessInstance) {
        const { data } = await ProcessManagerService.processServiceManagerApi.post<IMongoProcessInstanceWithSteps>(
            `${instancesBaseRoute}`,
            processData,
        );
        return data;
    }

    static async updateProcessInstance(id: string, processData: IProcessInstance) {
        const { data } = await ProcessManagerService.processServiceManagerApi.put<IMongoProcessInstanceWithSteps>(
            `${instancesBaseRoute}/${id}`,
            processData,
        );
        return data;
    }

    static async archivedProcess(id: string, archived: Boolean) {
        const { data } = await ProcessManagerService.processServiceManagerApi.patch<IMongoProcessInstanceWithSteps>(
            `${instancesBaseRoute}/archive/${id}`,
            { archived },
        );

        return data;
    }

    static async deleteProcessInstance(id: string) {
        const { data } = await ProcessManagerService.processServiceManagerApi.delete<IMongoProcessInstanceWithSteps>(`${instancesBaseRoute}/${id}`);
        return data;
    }

    static async searchProcessInstances(body: ISearchProcessInstancesBody) {
        const { data } = await ProcessManagerService.processServiceManagerApi.post<IMongoProcessInstanceWithSteps[]>(
            `${instancesBaseRoute}/search`,
            body,
        );

        return data;
    }

    // Step Instance
    static async getStepInstanceById(id: string) {
        const { data } = await ProcessManagerService.processServiceManagerApi.get<IMongoStepInstance>(`${instancesBaseRoute}/steps/${id}`);
        return data;
    }

    static async getStepTemplateByStepInstanceId(id: string) {
        const { data } = await ProcessManagerService.processServiceManagerApi.get<IMongoStepTemplate>(
            `${instancesBaseRoute}/steps/${id}/step-template`,
        );
        return data;
    }

    static async updateStepInstance(id: string, stepStatus: UpdateStepReqBody) {
        const { data } = await ProcessManagerService.processServiceManagerApi.patch<IMongoStepInstance>(
            `${instancesBaseRoute}/steps/${id}`,
            stepStatus,
        );
        return data;
    }
}
