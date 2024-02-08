import menash from 'menashmq';
import config from '../config';

const {
    rabbit,
    service: { dbHeaderName },
} = config;

export enum Action {
    upsertGlobalIndex = 'upsertGlobalIndex',
    upsertTemplateIndex = 'upsertTemplateIndex',
    deleteTemplateIndex = 'deleteTemplateIndex',
}
export interface IUpdateIndexRequest {
    action: Action;
    templateId?: string;
}

export default class GlobalSearchIndexCreator {
    private dbName: string;

    constructor(dbName: string) {
        this.dbName = dbName;
    }

    private sendUpdateIndex(request: IUpdateIndexRequest) {
        return menash.send(rabbit.updateSearchIndexQueueName, request, { headers: { [dbHeaderName]: this.dbName } });
    }

    public sendUpdateIndexesOnUpdateTemplate(changedTemplateId: string) {
        return Promise.all([
            this.sendUpdateIndex({ action: Action.upsertGlobalIndex }),
            this.sendUpdateIndex({ action: Action.upsertTemplateIndex, templateId: changedTemplateId }),
        ]);
    }

    public sendUpdateIndexesOnDeleteTemplate(deletedTemplateId: string) {
        return Promise.all([
            this.sendUpdateIndex({ action: Action.upsertGlobalIndex }),
            this.sendUpdateIndex({ action: Action.deleteTemplateIndex, templateId: deletedTemplateId }),
        ]);
    }
}
