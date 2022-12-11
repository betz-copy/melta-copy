export interface IProcessSingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean';
    format?: 'date' | 'date-time' | 'email' | 'fileId';
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
}
export interface IProcessBasicStepTemplate {
    properties: {
        type: 'object';
        properties: Record<string, IProcessSingleProperty>;
    };
    propertiesOrder: string[];
}
export interface IProcessStepTemplate extends IProcessBasicStepTemplate {
    name: string;
    displayName: string;
    approvers: string[];
    iconFileId: string | null;
}

export interface IProcessTemplate {
    name: string;
    displayName: string;
    details: IProcessBasicStepTemplate;
    steps: IProcessStepTemplate[];
}

export interface IMongoProcessTemplate extends IProcessTemplate {
    _id: string;
    createdAt: string;
    updatedAt: string;
}
