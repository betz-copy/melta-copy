import { IMongoCategory, IMongoEntityTemplateWithConstraintsPopulated, IProperties } from '@microservices/shared';

export const emptyEntityTemplate: IMongoEntityTemplateWithConstraintsPopulated = {
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
        required: [],
    } as IProperties & { required: string[] },
    propertiesOrder: [],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: [],
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    uniqueConstraints: [],
    iconFileId: null,
};

export interface EntityWizardValues {
    template: IMongoEntityTemplateWithConstraintsPopulated;
    properties: Record<string, any>;
    attachmentsProperties: Record<string, File[] | File | undefined>;
}
