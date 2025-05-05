interface IEntitySingleProperty {
    type: 'string' | 'number' | 'boolean';
    title: string;
    format?: string;
    enum?: string[];
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId' | 'user';
    };
    identifier?: true;
    readOnly?: true;
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: number;
    isDailyAlert?: boolean;
    isDatePastAlert?: boolean;
    calculateTime?: boolean;
    relationshipReference?: {
        relationshipTemplateId?: string;
        relationshipTemplateDirection: 'outgoing' | 'incoming';
        relatedTemplateId: string;
        relatedTemplateField: string;
    };
    comment?: string;
    hideFromDetailsPage?: boolean;
    color?: string;
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
}

export interface ISearchEntityTemplatesBody {
    search?: string;
    ids?: string[];
    categoryIds?: string[];
    limit?: number;
    skip?: number;
}
