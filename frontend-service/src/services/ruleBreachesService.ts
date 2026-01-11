import { IServerSideGetRowsRequest } from '@ag-grid-community/core';
import axios from '../axios';
import { environment } from '../globals';
import { IPropertyValue } from '../interfaces/entities';
import { IRuleBreach } from '../interfaces/ruleBreaches/ruleBreach';
import { IRuleBreachAlertPopulated } from '../interfaces/ruleBreaches/ruleBreachAlert';
import { IRuleBreachRequestPopulated } from '../interfaces/ruleBreaches/ruleBreachRequest';

const { ruleBreachesRequests, ruleBreachesAlerts } = environment.api;

export const createRuleBreachRequestRequest = async (
    ruleBreachRequest: Omit<IRuleBreach, '_id' | 'createdAt' | 'originUserId'>,
    attachmentsProperties: Record<string, IPropertyValue> = {},
) => {
    const formData = new FormData();

    formData.append('brokenRules', JSON.stringify(ruleBreachRequest.brokenRules));
    formData.append('actions', JSON.stringify(ruleBreachRequest.actions));

    const filesToUpload = Object.entries(attachmentsProperties).filter(([_key, value]) => value instanceof File);

    filesToUpload.forEach(([key, value]) => {
        formData.append(key, value);
    });

    const { data } = await axios.post<IRuleBreachRequestPopulated>(ruleBreachesRequests, formData);
    return data;
};

export const getRuleBreachRequestsRequest = async (
    agGridRequest: Pick<IServerSideGetRowsRequest, 'startRow' | 'endRow' | 'sortModel' | 'filterModel'>,
) => {
    const { data } = await axios.post<{ rows: IRuleBreachRequestPopulated[]; lastRowIndex: number }>(`${ruleBreachesRequests}/search`, agGridRequest);
    return data;
};

export const getRuleBreachAlertsRequest = async (
    agGridRequest: Pick<IServerSideGetRowsRequest, 'startRow' | 'endRow' | 'sortModel' | 'filterModel'>,
) => {
    const { data } = await axios.post<{ rows: IRuleBreachAlertPopulated[]; lastRowIndex: number }>(`${ruleBreachesAlerts}/search`, agGridRequest);
    return data;
};

export const approveRuleBreachRequestRequest = async (breachId: string, childTemplateId?: string) => {
    const { data } = await axios.post<IRuleBreachRequestPopulated>(`${ruleBreachesRequests}/${breachId}/approve`, { childTemplateId });
    return data;
};

export const denyRuleBreachRequestRequest = async (breachId: string) => {
    const { data } = await axios.post<IRuleBreachRequestPopulated>(`${ruleBreachesRequests}/${breachId}/deny`);
    return data;
};

export const cancelRuleBreachRequestRequest = async (breachId: string) => {
    const { data } = await axios.post<IRuleBreachRequestPopulated>(`${ruleBreachesRequests}/${breachId}/cancel`);
    return data;
};

export const getBreachAlertById = async (breachId: string) => {
    const { data } = await axios.get<IRuleBreachAlertPopulated>(`${ruleBreachesAlerts}/${breachId}`);
    return data;
};

export const getBreachRequestById = async (breachId: string) => {
    const { data } = await axios.get<IRuleBreachRequestPopulated>(`${ruleBreachesRequests}/${breachId}`);
    return data;
};
