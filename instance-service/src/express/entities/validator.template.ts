import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import axios from 'axios';
import { Request, NextFunction, Response } from 'express';
import { trycatch } from '../../utils/lib';
import { getNeo4jDate, getNeo4jDateTime } from '../../utils/neo4j/lib';
import { ValidationError } from '../error';
import { IMongoEntityTemplate } from './interface';
import config from '../../config';

const { templateManager, neo4j } = config;
const { url, getByIdRoute, timeout } = templateManager;

const ajv = new Ajv();

ajv.addFormat('fileId', /.*/);
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);

export const getEntityTemplateById = async (templateId: string) => {
    const { result, err } = await trycatch(() => axios.get<IMongoEntityTemplate>(`${url}${getByIdRoute}/${templateId}`, { timeout }));

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
    return req.entityTemplate as IMongoEntityTemplate;
};

export const addStringFieldsAndNormalizeDateValues = (req: Request, _res: Response, next: NextFunction) => {
    const entityTemplate = fetchEntityTemplateFromRequest(req);
    const normalizedEntity = {};

    Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
        if (!(key in req.body.properties)) {
            return;
        }

        const propertyValue = req.body.properties[key];
        const { type, format } = value;

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
