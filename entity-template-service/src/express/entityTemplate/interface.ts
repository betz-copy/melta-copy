interface IBaseEntitySingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean';
}
interface IEntitySinglePropertyWithFormat extends IBaseEntitySingleProperty {
    title: string;
    type: 'string';
    format: 'date' | 'date-time' | 'email' | 'fileId';
}
interface IEntitySinglePropertyWithEnum extends IBaseEntitySingleProperty {
    title: string;
    type: 'string';
    enum: string[];
}

export type IEntitySingleProperty = IBaseEntitySingleProperty | IEntitySinglePropertyWithFormat | IEntitySinglePropertyWithEnum;

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
