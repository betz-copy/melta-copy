import { IMongoChildTemplatePopulated, ViewType } from '../../../interfaces/childTemplates';
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

export const emptyChildTemplate: IMongoChildTemplatePopulated = {
    ...emptyEntityTemplate,
    description: '',
    isFilterByCurrentUser: false,
    isFilterByUserUnit: false,
    filterByCurrentUserField: undefined,
    filterByUnitUserField: undefined,
    parentTemplate: emptyEntityTemplate,
    viewType: ViewType.categoryPage,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
    properties: {
        properties: {},
        required: [],
        type: 'object',
        hide: [],
    },
};

export interface EntityWizardValues {
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated;
    properties: Record<string, any> & { disabled: boolean };
    attachmentsProperties: Record<string, File[] | File | undefined>;
}
