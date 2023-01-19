import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { Request } from 'express';
import axios from 'axios';
import { formatInTimeZone, format } from 'date-fns-tz';
import { getNeo4jDate, getNeo4jDateTime } from '../../utils/neo4j/lib';
import { ValidationError } from '../error';
import { addPropertyToRequest } from '../../utils/express';
import config from '../../config';
import { EntityTemplateManagerService, IMongoEntityTemplate } from '../../externalServices/entityTemplateManager';
import { trycatch } from '../../utils/lib';

const { neo4j } = config;

const ajv = new Ajv();

ajv.addFormat('fileId', /.*/);
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);

const getEntityTemplateByIdOrThrowValidationError = async (templateId: string) => {
    const { result: entityTemplate, err: getEntityTemplateByIdErr } = await trycatch(() =>
        EntityTemplateManagerService.getEntityTemplateById(templateId),
    );

    if (getEntityTemplateByIdErr || !entityTemplate) {
        if (axios.isAxiosError(getEntityTemplateByIdErr) && getEntityTemplateByIdErr.response?.status === 404) {
            throw new ValidationError(`Entity template doesnt exist (id: "${templateId}")`);
        }

        throw getEntityTemplateByIdErr;
    }

    return entityTemplate;
};

export const validateEntity = async (req: Request) => {
    const entityTemplate = await getEntityTemplateByIdOrThrowValidationError(req.body.templateId);

    const validateFunction = ajv.compile(entityTemplate.properties);
    const valid = validateFunction(req.body.properties);

    if (!valid) {
        throw new ValidationError(`Entity does not match template schema: ${JSON.stringify(validateFunction.errors)}`);
    }

    addPropertyToRequest(req, 'entityTemplate', entityTemplate);
};

// same format as dates shown in UI
export const formatDateTimeForFullTextSearch = (date: Date) => {
    return formatInTimeZone(date, 'Asia/Jerusalem', 'dd/MM/yyyy, HH:mm:ss');
};
export const formatDateForFullTextSearch = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
};

export const addStringFieldsAndNormalizeDateValues = (
    entityProperties: Record<string, any>,
    entityTemplate: IMongoEntityTemplate,
): Record<string, any> => {
    const normalizedEntity = {};

    Object.entries(entityTemplate.properties.properties).forEach(([key, value]) => {
        if (!(key in entityProperties)) {
            return;
        }

        const propertyValue = entityProperties[key];
        const { type, format } = value;

        // For Neo4j fulltext search (supports only string properties)
        if (type !== 'string') {
            normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = String(propertyValue);
        }

        if (type === 'string' && format === 'date') {
            normalizedEntity[key] = getNeo4jDate(new Date(propertyValue));
            normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = formatDateForFullTextSearch(new Date(propertyValue));

            return;
        }

        if (type === 'string' && format === 'date-time') {
            normalizedEntity[key] = getNeo4jDateTime(new Date(propertyValue));
            normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = formatDateTimeForFullTextSearch(new Date(propertyValue));

            return;
        }

        normalizedEntity[key] = propertyValue;
    });

    return normalizedEntity;
};

export const validateConstraintsOfTemplate = async (req: Request) => {
    const { properties } = await getEntityTemplateByIdOrThrowValidationError(req.params.templateId);
    const propertiesKeys = Object.keys(properties.properties);

    const { requiredConstraints, uniqueConstraints }: { requiredConstraints: string[]; uniqueConstraints: string[][] } = req.body;

    requiredConstraints.forEach((constraintProp) => {
        const isConstraintPropertyUnknown = !propertiesKeys.includes(constraintProp);
        if (isConstraintPropertyUnknown) {
            throw new ValidationError(`required constraint of ${constraintProp} is unknown in template`);
        }
    });
    uniqueConstraints.forEach((constraintProps) => {
        const unknownPropertyInConstraint = constraintProps.find((property) => !propertiesKeys.includes(property));
        if (unknownPropertyInConstraint) {
            throw new ValidationError(
                `unique constraint of ${constraintProps} contains unknown property "${unknownPropertyInConstraint}" in template`,
            );
        }
    });

    uniqueConstraints.forEach((uniqueConstraint) => {
        const uniqueConstraintPropertyThatIsNotInRequired = uniqueConstraint.find((property) => !requiredConstraints.includes(property));

        if (uniqueConstraintPropertyThatIsNotInRequired) {
            // because neo4j 4.0 supports unique constraints but makes them required too
            throw new ValidationError(
                `property ${uniqueConstraintPropertyThatIsNotInRequired} is in unique constraint, so it must be in required too`,
            );
        }
    });
};
