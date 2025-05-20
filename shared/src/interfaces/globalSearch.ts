export enum IndexingAction {
    upsertGlobalIndex = 'upsertGlobalIndex',
    upsertTemplateIndex = 'upsertTemplateIndex',
    deleteTemplateIndex = 'deleteTemplateIndex',
}
export interface IUpdateIndexRequest {
    action: IndexingAction;
    templateId?: string;
}
