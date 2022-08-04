export interface IEntitySingleProperty {
    type: 'string' | 'number' | 'boolean';
    title: string;
    format?: string;
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    iconFileId?: string;
    properties: {
        type: 'object';
        properties: Record<string, IEntitySingleProperty>;
        required: string[];
    };
    disabled: boolean;
    category: string;
    propertiesOrder: string[];
    propertiesPreview: string[];
}

export interface IMongoEntityTemplate extends IEntityTemplate {
    _id: string;
}
