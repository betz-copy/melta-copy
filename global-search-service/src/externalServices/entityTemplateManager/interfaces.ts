interface IEntitySingleProperty {
    type: 'string' | 'number' | 'boolean';
    title: string;
    format?: string;
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: number;
    isDailyAlert?: boolean;
    calculateTime?: boolean;
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId';
    };
    relationshipReference?: {
        relationshipTemplateId?: string;
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
    };
}

interface IJSONSchema {
    properties: Record<string, IEntitySingleProperty>;
    type: 'object';
    required: string[];
}

export interface IEntityTemplate {
    _id: string;
    name: string;
    displayName: string;
    iconFileId: string | null;
    properties: IJSONSchema;
    category: string;
    propertiesOrder: string[];
    propertiesTypeOrder: ('properties' | 'attachmentProperties')[];
    propertiesPreview: string[];
    disabled: boolean;
    documentTemplatesIds?: string[];
    path?: string;
}

export interface ISearchEntityTemplatesBody {
    search?: string;
    ids?: string[];
    categoryIds?: string[];
    limit?: number;
    skip?: number;
}
