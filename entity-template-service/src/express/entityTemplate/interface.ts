interface IPropertyTypes {
    title: string;
    type: 'string' | 'number' | 'boolean';
}
interface IPropertyFormat {
    title: string;
    type: 'string';
    format: 'date' | 'date-time' | 'email' | 'fileId';
}
interface IPropertyEnum {
    title: string;
    type: 'string';
    enum: [string];
}

export type IProperty = IPropertyTypes | IPropertyEnum | IPropertyFormat;

export interface IProperties {
    type: 'object';
    properties: Record<string, IProperty>;
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
