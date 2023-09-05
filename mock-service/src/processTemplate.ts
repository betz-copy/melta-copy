import axios from 'axios';
import config from './config';
import { trycatch } from './utils';

const { uri, createProcessTemplateRoute, isAliveRoute } = config.processService;

// Interfaces
export interface IProcessSingleProperty {
    title: string;
    type: 'string' | 'number' | 'boolean';
    format?: 'date' | 'date-time' | 'email' | 'fileId' | 'entityId';
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
}
export interface IProcessDetails {
    properties: {
        type: 'object';
        properties: Record<string, IProcessSingleProperty>;
    };
    propertiesOrder: string[];
}

export interface IStepTemplate extends IProcessDetails {
    name: string;
    displayName: string;
    reviewers: string[];
    iconFileId: string | null;
}

export interface IMongoStepTemplate extends IStepTemplate {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IProcessTemplateWithSteps {
    name: string;
    displayName: string;
    details: IProcessDetails;
    steps: IStepTemplate[];
}

export interface IMongoProcessTemplatePopulated extends Omit<IProcessTemplateWithSteps, 'steps'> {
    steps: IMongoStepTemplate[];
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}

export const createProcessTemplates = async (processTemplates: IProcessTemplateWithSteps[]) => {
    const promises = processTemplates.map((processTemplate) => {
        return axios.post<IMongoProcessTemplatePopulated>(uri + createProcessTemplateRoute, {
            ...processTemplate,
        });
    });

    const results = await Promise.all(promises);
    return results.map((result) => result.data);
};

export const isProcessServiceAlive = async () => {
    const { result, err } = await trycatch(() => axios.get(uri + isAliveRoute));

    return { result, err };
};
