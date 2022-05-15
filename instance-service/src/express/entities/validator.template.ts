import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import axios from 'axios';
import { Request, NextFunction, Response } from 'express';
import config from '../../config';
import { trycatch } from '../../utils/lib';
import { getNeo4jDate } from '../../utils/neo4j/lib';
import { ValidationError } from '../error';

interface IJSONSchema {
    properties: object;
    type: string;
    required: string[];
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
const { url, getByIdRoute, timeout } = templateManager;

const ajv = new Ajv();

ajv.addFormat('fileId', /.*/);
addFormats(ajv);

export const getEntityTemplateById = async (templateId: string) => {
    const { result, err } = await trycatch(() => axios.get<IEntityTemplate>(`${url}${getByIdRoute}/${templateId}`, { timeout }));

    if (err || !result) {
        throw new ValidationError(`Failed to fetch entity template schema (id: ${templateId})`);
    }

    return result.data;
};

const addEntityTemplateToRequest = (req: any, value: any) => {
    req.entityTemplate = value;
};

export const validateEntity = async (req: Request) => {
    const entityTemplate = await getEntityTemplateById(req.body.templateId);

    const validateFunction = ajv.compile(entityTemplate.properties);
    const valid = validateFunction(req.body.properties);

    if (!valid) {
        throw new ValidationError(`Entity does not match template schema: ${JSON.stringify(validateFunction.errors)}`);
    }

    addEntityTemplateToRequest(req, entityTemplate);
};

const fetchEntityTemplateFromRequest = (req: any) => {
    return req.entityTemplate as IEntityTemplate;
};

export const addStringFieldsAndNormalizeDateValues = (req: Request, _res: Response, next: NextFunction) => {
    const entityTemplate = fetchEntityTemplateFromRequest(req);
    const normalizedEntity = {};

    Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
        const propertyValue = req.body.properties[key];
        const { type, format } = value;

        if (!propertyValue) {
            return;
        }

        // For Neo4j fulltext search (supports only string properties)
        if (type !== 'string' || format === 'date') {
            normalizedEntity[`${key}_tostring`] = String(propertyValue);
        }

        normalizedEntity[key] = type === 'string' && format === 'date' ? getNeo4jDate(new Date(propertyValue)) : propertyValue;
    });

    req.body.properties = normalizedEntity;

    next();
};
