import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import axios from 'axios';
import { Request } from 'express';
import config from '../../config';
import { trycatch } from '../../utils/lib';
import { ValidationError } from '../error';

interface IEntityTemplate {
    name: string;
    displayName: string;
    category: string;
    properties: object;
    disabled: boolean;
}

const { templateManager } = config;
const { url, getByIdRoute, timeout } = templateManager;

const ajv = new Ajv();
addFormats(ajv);

export const getEntityTemplateById = async (templateId: string) => {
    const { result, err } = await trycatch(() => axios.get<IEntityTemplate>(`${url}${getByIdRoute}/${templateId}`, { timeout }));

    if (err || !result) {
        throw new ValidationError(`Failed to fetch entity template schema (id: ${templateId})`);
    }

    return result.data;
};

export const validateEntity = async (req: Request) => {
    const entityTemplate = await getEntityTemplateById(req.body.templateId);

    const validate = ajv.compile(entityTemplate.properties);
    const valid = validate(req.body.properties);

    if (!valid) {
        throw new ValidationError(`Entity does not match template schema: ${JSON.stringify(validate.errors)}`);
    }
};
