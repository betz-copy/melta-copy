import config from '../../config';
import { IAgGridRequest, IAgGridResult } from '../../utils/agGrid/interface';
import DefaultExternalServiceApi from '../../utils/express/externalService';
import { ActionTypes, IActionMetadata, IBrokenRule, IRuleBreachAlert, IRuleBreachRequest, RuleBreachRequestStatus } from './interfaces';

const { url, baseRoute, requestTimeout } = config.ruleBreachService;

export class RuleBreachService extends DefaultExternalServiceApi {
    constructor(dbName: string) {
        super(dbName, { baseURL: `${url}${baseRoute}`, timeout: requestTimeout });
    }

    async createRuleBreachRequest<T>(ruleBreachRequestData: Omit<IRuleBreachRequest<T>, '_id' | 'createdAt'>): Promise<IRuleBreachRequest<T>> {
        const { data } = await this.api.post<IRuleBreachRequest<T>>('/requests', ruleBreachRequestData);
        return data;
    }

    async createRuleBreachAlert<T>(ruleBreachAlertData: Omit<IRuleBreachAlert<T>, '_id' | 'createdAt'>): Promise<IRuleBreachAlert<T>> {
        const { data } = await this.api.post<IRuleBreachAlert<T>>('/alerts', ruleBreachAlertData);
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

    async updateRuleBreachRequestActionMetadata(
        ruleBreachRequestId: string,
        actionType: ActionTypes,
        actionMetadata: IActionMetadata,
    ): Promise<IRuleBreachRequest> {
        const { data } = await this.api.patch<IRuleBreachRequest>(`/requests/${ruleBreachRequestId}/action-metadata`, {
            actionType,
            actionMetadata,
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
