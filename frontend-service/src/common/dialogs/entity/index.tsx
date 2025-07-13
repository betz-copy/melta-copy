import { IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

export const emptyEntityTemplate: IMongoEntityTemplatePopulated = {
    _id: '',
    displayName: '',
    name: '',
    category: {
        _id: '',
        name: '',
        displayName: '',
        color: '',
        templatesOrder: [],
    },
    properties: {
        properties: {},
        required: [],
        type: 'object',
        hide: [],
    },
    propertiesOrder: [],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: [],
    uniqueConstraints: [],
    disabled: false,
};

export interface EntityWizardValues {
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated;
    properties: Record<string, any> & { disabled: boolean };
    attachmentsProperties: Record<string, File[] | File | undefined>;
}
