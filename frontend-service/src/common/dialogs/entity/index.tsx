import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
export interface EntityWizardValues {
    template: IMongoEntityTemplatePopulated;
    properties: object & { disabled: boolean };
    attachmentsProperties: Record<string, File[] | File | undefined>;
}

