import menash from 'menashmq';
import config from '../config';

const { rabbit } = config;

export enum Action {
    upsertGlobalIndex = 'upsertGlobalIndex',
    upsertTemplateIndex = 'upsertTemplateIndex',
    deleteTemplateIndex = 'deleteTemplateIndex',
}
export interface IUpdateIndexRequest {
    action: Action;
    templateId?: string;
}

const sendUpdateIndex = (request: IUpdateIndexRequest) => {
    return menash.send(rabbit.updateSearchIndexQueueName, request);
};

export const sendUpdateIndexesOnUpdateTemplate = async (changedTemplateId: string) => {
    return Promise.all([
        sendUpdateIndex({ action: Action.upsertGlobalIndex }),
        sendUpdateIndex({ action: Action.upsertTemplateIndex, templateId: changedTemplateId }),
    ]);
};

export const sendUpdateIndexesOnDeleteTemplate = async (deletedTemplateId: string) => {
    return Promise.all([
        sendUpdateIndex({ action: Action.upsertGlobalIndex }),
        sendUpdateIndex({ action: Action.deleteTemplateIndex, templateId: deletedTemplateId }),
    ]);
};
