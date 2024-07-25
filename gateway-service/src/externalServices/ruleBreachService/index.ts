import axios from 'axios';
import config from '../../config';
import { IAgGridRequest, IAgGridResult } from '../../utils/agGrid/interface';
import { ActionTypes, IActionMetadata, IBrokenRule, IRuleBreachAlert, IRuleBreachRequest, RuleBreachRequestStatus } from './interfaces';

const { url, baseRoute, requestTimeout } = config.ruleBreachService;

export class RuleBreachService {
    private static ruleBreachService = axios.create({
        baseURL: `${url}${baseRoute}`,
        timeout: requestTimeout,
    });

    static async createRuleBreachRequest(ruleBreachRequestData: Omit<IRuleBreachRequest, '_id' | 'createdAt'>): Promise<IRuleBreachRequest> {
        const { data } = await this.ruleBreachService.post<IRuleBreachRequest>('/requests', ruleBreachRequestData);
        return data;
    }

    static async createRuleBreachAlert(ruleBreachAlertData: Omit<IRuleBreachAlert, '_id' | 'createdAt'>): Promise<IRuleBreachAlert> {
        const { data } = await this.ruleBreachService.post<IRuleBreachAlert>('/alerts', ruleBreachAlertData);
        return data;
    }

    static async updateRuleBreachRequestStatus(
        ruleBreachRequestId: string,
        reviewerId: string,
        status: RuleBreachRequestStatus,
    ): Promise<IRuleBreachRequest> {
        const { data } = await this.ruleBreachService.patch<IRuleBreachRequest>(`/requests/${ruleBreachRequestId}/status`, {
            reviewerId,
            status,
        });
        return data;
    }

    static async searchRuleBreachRequests(agGridRequest: IAgGridRequest): Promise<IAgGridResult<IRuleBreachRequest>> {
        const { data } = await this.ruleBreachService.post<IAgGridResult<IRuleBreachRequest>>('/requests/search', agGridRequest);
        return data;
    }

    static async searchRuleBreachAlerts(agGridRequest: IAgGridRequest): Promise<IAgGridResult<IRuleBreachAlert>> {
        const { data } = await this.ruleBreachService.post<IAgGridResult<IRuleBreachAlert>>('/alerts/search', agGridRequest);
        return data;
    }

    static async getRuleBreachRequestById(ruleBreachRequestId: string): Promise<IRuleBreachRequest> {
        const { data } = await this.ruleBreachService.get<IRuleBreachRequest>(`/requests/${ruleBreachRequestId}`);
        return data;
    }

    static async getRuleBreachAlertById(ruleBreachAlertId: string): Promise<IRuleBreachAlert> {
        const { data } = await this.ruleBreachService.get<IRuleBreachAlert>(`/alerts/${ruleBreachAlertId}`);
        return data;
    }

    static async getManyRuleBreaches(rulesBreachIds: string[]): Promise<IRuleBreachRequest[]> {
        const { data } = await this.ruleBreachService.post<IRuleBreachRequest[]>(`/requests/getManys`, { rulesBreachIds });
        return data;
    }

    static async updateRuleBreachRequestActionsMetadatas(
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

    static async updateRuleBreachRequestBrokenRules(ruleBreachRequestId: string, brokenRules: IBrokenRule[]): Promise<IRuleBreachRequest> {
        const { data } = await this.ruleBreachService.patch<IRuleBreachRequest>(`/requests/${ruleBreachRequestId}/broken-rules`, {
            brokenRules,
        });
        return data;
    }

    static async getRuleBreachAlertsByRuleId(ruleId: string) {
        const { data } = await this.ruleBreachService.get<IRuleBreachAlert[]>(`/alerts/broken-rules/${ruleId}`);

        return data;
    }

    static async getRuleBreachRequestsByRuleId(ruleId: string) {
        const { data } = await this.ruleBreachService.get<IRuleBreachRequest[]>(`/requests/broken-rules/${ruleId}`);

        return data;
    }
}
