import config from '../../config';
import { IAgGridRequest, IAgGridResult } from '../../utils/agGrid/interface';
import DefaultExternalServiceApi from '../../utils/express/externalService';
import { ActionTypes, IActionMetadata, IBrokenRule, IRuleBreachAlert, IRuleBreachRequest, RuleBreachRequestStatus } from './interfaces';

const { url, baseRoute, requestTimeout } = config.ruleBreachService;

export class RuleBreachService extends DefaultExternalServiceApi {
    constructor(workspaceId: string) {
        super(workspaceId, { baseURL: `${url}${baseRoute}`, timeout: requestTimeout });
    }

    static async createRuleBreachRequest(ruleBreachRequestData: Omit<IRuleBreachRequest, '_id' | 'createdAt'>): Promise<IRuleBreachRequest> {
        const { data } = await this.ruleBreachService.post<IRuleBreachRequest>('/requests', ruleBreachRequestData);
        return data;
    }

    static async createRuleBreachAlert(ruleBreachAlertData: Omit<IRuleBreachAlert, '_id' | 'createdAt'>): Promise<IRuleBreachAlert> {
        const { data } = await this.ruleBreachService.post<IRuleBreachAlert>('/alerts', ruleBreachAlertData);
        return data;
    }

    async updateRuleBreachRequestStatus(
        ruleBreachRequestId: string,
        reviewerId: string,
        status: RuleBreachRequestStatus,
    ): Promise<IRuleBreachRequest> {
        const { data } = await this.api.patch<IRuleBreachRequest>(`/requests/${ruleBreachRequestId}/status`, {
            reviewerId,
            status,
        });
        return data;
    }

    async searchRuleBreachRequests(agGridRequest: IAgGridRequest): Promise<IAgGridResult<IRuleBreachRequest>> {
        const { data } = await this.api.post<IAgGridResult<IRuleBreachRequest>>('/requests/search', agGridRequest);
        return data;
    }

    async searchRuleBreachAlerts(agGridRequest: IAgGridRequest): Promise<IAgGridResult<IRuleBreachAlert>> {
        const { data } = await this.api.post<IAgGridResult<IRuleBreachAlert>>('/alerts/search', agGridRequest);
        return data;
    }

    async getRuleBreachRequestById(ruleBreachRequestId: string): Promise<IRuleBreachRequest> {
        const { data } = await this.api.get<IRuleBreachRequest>(`/requests/${ruleBreachRequestId}`);
        return data;
    }

    async getRuleBreachAlertById(ruleBreachAlertId: string): Promise<IRuleBreachAlert> {
        const { data } = await this.api.get<IRuleBreachAlert>(`/alerts/${ruleBreachAlertId}`);
        return data;
    }

    static async getManyRuleBreaches(rulesBreachIds: string[]): Promise<IRuleBreachRequest[]> {
        const { data } = await this.ruleBreachService.post<IRuleBreachRequest[]>(`/requests/get-many`, { rulesBreachIds });
        return data;
    }

    static async updateRuleBreachRequestActionsMetadata(
        ruleBreachRequestId: string,
        actions: {
            actionType: ActionTypes;
            actionMetadata: IActionMetadata;
        }[],
    ): Promise<IRuleBreachRequest> {
        const { data } = await this.ruleBreachService.patch<IRuleBreachRequest>(`/requests/${ruleBreachRequestId}/action-metadata`, {
            actions,
        });
        return data;
    }

    async updateRuleBreachRequestBrokenRules(ruleBreachRequestId: string, brokenRules: IBrokenRule[]): Promise<IRuleBreachRequest> {
        const { data } = await this.api.patch<IRuleBreachRequest>(`/requests/${ruleBreachRequestId}/broken-rules`, {
            brokenRules,
        });
        return data;
    }

    async getRuleBreachAlertsByRuleId(ruleId: string) {
        const { data } = await this.api.get<IRuleBreachAlert[]>(`/alerts/broken-rules/${ruleId}`);

        return data;
    }

    async getRuleBreachRequestsByRuleId(ruleId: string) {
        const { data } = await this.api.get<IRuleBreachRequest[]>(`/requests/broken-rules/${ruleId}`);

        return data;
    }
}
