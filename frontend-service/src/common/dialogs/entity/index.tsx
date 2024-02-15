import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

export interface EntityWizardValues {
    template: IMongoEntityTemplatePopulated;
    properties: object & { disabled: boolean };
    attachmentsProperties: Record<string, File | undefined>;
}

export interface EntityWizardValuesNew {
    template: IMongoEntityTemplatePopulated;
    properties: object & { disabled: boolean };
    attachmentsProperties: Record<string, File[] | undefined>;
}

