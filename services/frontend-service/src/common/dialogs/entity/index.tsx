import { IMongoCategory, IMongoEntityTemplatePopulated, IProperties } from '@microservices/shared';

export const emptyEntityTemplate: IMongoEntityTemplatePopulated = {
    _id: '',
    displayName: '',
    name: '',
    category: {
        _id: '',
        name: '',
        displayName: '',
        color: '',
    } as IMongoCategory,
    properties: {
        properties: {},
        type: 'object',
        hide: [],
    } as IProperties,
    propertiesOrder: [],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: [],
    disabled: false,
    createdAt: '',
    updatedAt: '',
};

export interface EntityWizardValues {
    template: IMongoEntityTemplatePopulated;
    properties: Record<string, any> & { disabled: boolean };
    attachmentsProperties: Record<string, File[] | File | undefined>;
}
