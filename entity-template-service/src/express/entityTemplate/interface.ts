export interface IEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    format?: 'date' | 'date-time' | 'email' | 'fileId' | 'text-area';
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
    dateNotification?: 'day' | 'week' | 'twoWeeks';
    calculateTime?: boolean;
    serialStarter?: number;
    serialCurrent?: number;
    items?: {
        type: 'string';
        enum?: string[];
        format?: 'fileId';
    };
    minItems?: 1;
    uniqueItems?: true;
}

export interface IProperties {
    type: 'object';
    properties: Record<string, IEntitySingleProperty>;
    hide: string[];
}

export type IEnumPropertiesColors = Record<string, Record<string, string>>; // { [fieldName]: { [enumOption1]: [color1], [enumOption2]: [color2] } }

export interface IEntityTemplate {
    name: string;
    displayName: string;
    category: string;
    properties: IProperties;
    propertiesOrder: string[];
    propertiesTypeOrder: ('properties' | 'attachmentProperties')[];
    propertiesPreview: string[];
    enumPropertiesColors?: IEnumPropertiesColors;
    disabled: boolean;
    iconFileId: string | null;
}
