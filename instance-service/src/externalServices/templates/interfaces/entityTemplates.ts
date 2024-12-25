export interface IRelationshipReference {
    relationshipTemplateId?: string;
    relationshipTemplateDirection: 'outgoing' | 'incoming';
    relatedTemplateId: string;
    relatedTemplateField: string;
}

export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?: string;
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: number;
    isDailyAlert?: boolean;
    isDatePastAlert?: boolean;
    calculateTime?: boolean;
    serialStarter?: number;
    serialCurrent?: number;
    relationshipReference?: IRelationshipReference;
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId';
    };
    minItems?: 1;
    uniqueItems?: true;
    archive?: boolean;
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    iconFileId?: string;
    documentTemplatesIds?: string[];
    properties: {
        type: 'object';
        properties: Record<string, IEntitySingleProperty>;
        hide: [];
    };
    disabled: boolean;
    category: string;
    propertiesOrder: string[];
    propertiesTypeOrder: ('properties' | 'attachmentProperties')[];
    propertiesPreview: string[];
    actions?: string;
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ISearchEntityTemplatesBody {
    search?: string;
    ids?: string[];
    categoryIds?: string[];
    limit?: number;
    skip?: number;
}
