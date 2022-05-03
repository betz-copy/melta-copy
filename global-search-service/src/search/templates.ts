import axios from 'axios';

import config from '../config';
import { trycatch } from '../utils/index';

interface IJSONSchema {
    properties: object;
    type: string;
}

interface IEntityTemplate {
    _id: string;
    name: string;
    displayName: string;
    category: string;
    properties: IJSONSchema;
    disabled: boolean;
}

const { templateManager } = config;
const { url, getTemplatesRoute, timeout } = templateManager;

const getEntityTemplates = async () => {
    const { result, err } = await trycatch(() => axios.get<IEntityTemplate[]>(`${url}${getTemplatesRoute}`, { timeout }));

    if (err || !result) {
        throw new Error(`Failed to fetch entity templates: ${err}`);
    }

    return result.data;
};

export default getEntityTemplates;
