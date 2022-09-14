import axios from 'axios';
import config from '../../config';
import { IAgGridRequest, IAgGridResult } from '../../utils/agGrid/interface';
import { ActionTypes, IActionMetadata, IBrokenRule, IRuleBreachAlert, IRuleBreachRequest, RuleBreachRequestStatus } from './interfaces';

const { uri, baseRoute, requestTimeout } = config.ruleBreachService;

export class RuleBreachService {
    private static ruleBreachService = axios.create({
        baseURL: `${uri}${baseRoute}`,
        timeout: requestTimeout,
    });

    static async createRuleBreachRequest<T>(ruleBreachRequestData: Omit<IRuleBreachRequest<T>, '_id' | 'createdAt'>): Promise<IRuleBreachRequest<T>> {
        const { data } = await this.ruleBreachService.post<IRuleBreachRequest<T>>('/requests', ruleBreachRequestData);
        return data;
    }

    static async createRuleBreachAlert<T>(ruleBreachAlertData: Omit<IRuleBreachAlert<T>, '_id' | 'createdAt'>): Promise<IRuleBreachAlert<T>> {
        const { data } = await this.ruleBreachService.post<IRuleBreachAlert<T>>('/alerts', ruleBreachAlertData);
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

    static async updateRuleBreachRequestActionMetadata(
        ruleBreachRequestId: string,
        actionType: ActionTypes,
        actionMetadata: IActionMetadata,
    ): Promise<IRuleBreachRequest> {
        const { data } = await this.ruleBreachService.patch<IRuleBreachRequest>(`/requests/${ruleBreachRequestId}/action-metadata`, {
            actionType,
            actionMetadata,
        });
        return data;
    }

    static async updateRuleBreachRequestBrokenRules(ruleBreachRequestId: string, brokenRules: IBrokenRule[]): Promise<IRuleBreachRequest> {
        const { data } = await this.ruleBreachService.patch<IRuleBreachRequest>(`/requests/${ruleBreachRequestId}/broken-rules`, {
            brokenRules,
        });
        return data;
    }
}
