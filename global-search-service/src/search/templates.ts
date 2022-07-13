import axios from 'axios';

import config from '../config';
import { trycatch } from '../utils/index';

interface IEntitySingleProperty {
    type: 'string' | 'number' | 'boolean';
    title: string;
    format?: string;
    enum?: string[];
    pattern?: string;
    patternCustomErrorMessage?: string;
}

interface IJSONSchema {
    properties: Record<string, IEntitySingleProperty>;
    type: 'object';
    required: string[];
}

interface IEntityTemplate {
    _id: string;
    name: string;
    displayName: string;
    iconFileId: string | null;
    properties: IJSONSchema;
    category: string;
    propertiesOrder: string[];
    propertiesPreview: string[];
    disabled: boolean;
}

const { templateManager } = config;
const { url, getTemplatesRoute, timeout } = templateManager;

const getEntityTemplates = async () => {
    const { result, err } = await trycatch(() => axios.post<IEntityTemplate[]>(`${url}${getTemplatesRoute}`, {}, { timeout }));

    if (err || !result) {
        throw new Error(`Failed to fetch entity templates: ${err}`);
    }

    return result.data;
};

export default getEntityTemplates;
