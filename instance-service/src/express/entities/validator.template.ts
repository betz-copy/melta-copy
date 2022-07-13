import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import axios from 'axios';
import { Request, NextFunction, Response } from 'express';
import config from '../../config';
import { trycatch } from '../../utils/lib';
import { defaultJsonSchemaProperties, getNeo4jDate, getNeo4jDateTime } from '../../utils/neo4j/lib';
import { ValidationError } from '../error';

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
    name: string;
    displayName: string;
    iconFileId: string | null;
    properties: IJSONSchema;
    category: string;
    propertiesOrder: string[];
    propertiesPreview: string[];
    disabled: boolean;
}

const { templateManager, neo4j } = config;
const { url, getByIdRoute, timeout } = templateManager;

const ajv = new Ajv();

ajv.addFormat('fileId', /.*/);
addFormats(ajv);
ajv.addKeyword('patternCustomErrorMessage');

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
    const jsonSchemaProperties = { ...entityTemplate.properties.properties, ...defaultJsonSchemaProperties } as IJSONSchema;

    Object.entries(jsonSchemaProperties).forEach(([key, value]) => {
        const propertyValue = req.body.properties[key];
        const { type, format } = value;

        if (!propertyValue) {
            return;
        }

        // For Neo4j fulltext search (supports only string properties)
        if (type !== 'string') {
            normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = String(propertyValue);
        }

        if (type === 'string' && format === 'date') {
            normalizedEntity[key] = getNeo4jDate(new Date(propertyValue));
            normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = new Date(propertyValue).toLocaleDateString('en-uk');

            return;
        }

        if (type === 'string' && format === 'date-time') {
            normalizedEntity[key] = getNeo4jDateTime(new Date(propertyValue));
            normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = new Date(propertyValue).toLocaleString('en-uk');

            return;
        }

        normalizedEntity[key] = propertyValue;
    });

    req.body.properties = normalizedEntity;

    next();
};
