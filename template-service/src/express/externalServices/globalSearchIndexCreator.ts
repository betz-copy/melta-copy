import config from '../../config';
import DefaultExternalServiceRabbit from '../../utils/rabbit/manager';

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

export default class GlobalSearchIndexCreator extends DefaultExternalServiceRabbit {
    async sendUpdateIndex(request: IUpdateIndexRequest) {
        return this.sendToQueue(rabbit.updateSearchIndexQueueName, request);
    }

    async sendUpdateIndexesOnUpdateTemplate(changedTemplateId: string) {
        return Promise.all([
            this.sendUpdateIndex({ action: Action.upsertGlobalIndex }),
            this.sendUpdateIndex({ action: Action.upsertTemplateIndex, templateId: changedTemplateId }),
        ]);
    }

    async sendUpdateIndexesOnDeleteTemplate(deletedTemplateId: string) {
        return Promise.all([
            this.sendUpdateIndex({ action: Action.upsertGlobalIndex }),
            this.sendUpdateIndex({ action: Action.deleteTemplateIndex, templateId: deletedTemplateId }),
        ]);
    }
}
