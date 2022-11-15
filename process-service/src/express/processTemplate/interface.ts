export interface IProcessSingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean';
    format?: 'date' | 'date-time' | 'email' | 'fileId';
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
}
export interface IProcessStepTemplate {
    name: string;
    displayName: string;
    properties: {
        type: 'object';
        properties: Record<string, IProcessSingleProperty>;
    };
    propertiesOrder: string[];
}
export interface IProcessTemplate {
    name: string;
    displayName: string;
    steps: IProcessStepTemplate[];
}

export interface IMongoProcessTemplate extends IProcessTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}
