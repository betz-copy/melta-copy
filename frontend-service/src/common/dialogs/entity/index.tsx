import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

export interface EntityWizardValues {
    template: IMongoEntityTemplatePopulated;
    properties: Record<string, any>;
    attachmentsProperties: Record<string, File[] | File | undefined>;
}
