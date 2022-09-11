export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean';
    format?: 'date' | 'date-time' | 'email' | 'fileId';
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
}

export interface IProperties {
    type: 'object';
    properties: Record<string, IEntitySingleProperty>;
    required: string[];
}

export interface IEntityTemplate {
    name: string;
    displayName: string;
    category: string;
    properties: IProperties;
    propertiesOrder: string[];
    propertiesPreview: string[];
    disabled: boolean;
    iconFileId: string | null;
}
