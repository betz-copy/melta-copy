export interface IInnerProperties {
    [key: string]: {
        title: string;
        type: string;
        format?: 'date' | 'time' | 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' | 'uri';
    };
}

export interface IProperties {
    type: 'object';
    properties: IInnerProperties;
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
