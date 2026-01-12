import { IMongoChildTemplateWithConstraintsPopulated, ViewType } from '@packages/child-template';
import { IPropertyValue } from '@packages/entity';
import { IFullMongoEntityTemplate, IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';

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
export type EntityWizardValues = {
    template: IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated;
    properties: Record<string, IPropertyValue> & { disabled: boolean };
    attachmentsProperties: Record<string, File[] | File | undefined>;
};
