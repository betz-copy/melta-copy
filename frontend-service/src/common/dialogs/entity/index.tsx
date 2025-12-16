import {
    IFullMongoEntityTemplate,
    IMongoChildTemplateWithConstraintsPopulated,
    IMongoEntityTemplateWithConstraintsPopulated,
    ViewType,
} from '@microservices/shared';

export const emptyEntityTemplate: IMongoEntityTemplateWithConstraintsPopulated = {
    _id: '',
    displayName: '',
    name: '',
    category: {
        _id: '',
        name: '',
        displayName: '',
        color: '',
        templatesOrder: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        iconFileId: null,
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
    createdAt: new Date(),
    updatedAt: new Date(),
    iconFileId: null,
};

const emptyParentTemplateForChild: IFullMongoEntityTemplate = {
    _id: '',
    displayName: '',
    name: '',
    category: '',
    properties: {
        properties: {},
        type: 'object',
        hide: [],
    },
    propertiesOrder: [],
    propertiesTypeOrder: ['properties', 'attachmentProperties'],
    propertiesPreview: [],
    disabled: false,
    iconFileId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

export const emptyChildTemplate: IMongoChildTemplateWithConstraintsPopulated = {
    ...emptyEntityTemplate,
    description: '',
    isFilterByCurrentUser: false,
    isFilterByUserUnit: false,
    filterByCurrentUserField: undefined,
    filterByUnitUserField: undefined,
    parentTemplate: emptyParentTemplateForChild,
    viewType: ViewType.categoryPage,
    createdAt: new Date(),
    updatedAt: new Date(),
    properties: {
        properties: {},
        required: [],
        type: 'object',
        hide: [],
    },
    uniqueConstraints: [],
};

export interface EntityWizardValues {
    template: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated;
    properties: Record<string, any> & { disabled: boolean };
    attachmentsProperties: Record<string, File[] | File | undefined>;
}
