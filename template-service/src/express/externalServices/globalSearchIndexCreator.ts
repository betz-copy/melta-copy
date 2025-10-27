import { IndexingAction, IUpdateIndexRequest } from '@microservices/shared';
import config from '../../config';
import DefaultExternalServiceRabbit from '../../utils/rabbit/manager';

const { rabbit } = config;

export default class GlobalSearchIndexCreator extends DefaultExternalServiceRabbit {
    async sendUpdateIndex(request: IUpdateIndexRequest) {
        return this.sendToQueue(rabbit.updateSearchIndexQueueName, request);
    }

    async sendUpdateIndexesOnUpdateTemplate(changedTemplateId: string) {
        return Promise.all([
            this.sendUpdateIndex({ action: IndexingAction.upsertGlobalIndex }),
            this.sendUpdateIndex({ action: IndexingAction.upsertTemplateIndex, templateId: changedTemplateId }),
        ]);
    }

    async sendUpdateIndexesOnDeleteTemplate(deletedTemplateId: string) {
        return Promise.all([
            this.sendUpdateIndex({ action: IndexingAction.upsertGlobalIndex }),
            this.sendUpdateIndex({ action: IndexingAction.deleteTemplateIndex, templateId: deletedTemplateId }),
        ]);
    }
}
