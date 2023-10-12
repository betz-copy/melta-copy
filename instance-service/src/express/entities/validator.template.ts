import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { Request } from 'express';
import axios from 'axios';
import { formatInTimeZone as formatFnsInTimeZone, format as formatFns } from 'date-fns-tz';
import { isValid as isValidDate, parse } from 'date-fns';
import { getNeo4jDate, getNeo4jDateTime } from '../../utils/neo4j/lib';
import { ValidationError } from '../error';
import { addPropertyToRequest } from '../../utils/express';
import config from '../../config';
import { EntityTemplateManagerService, IEntitySingleProperty, IMongoEntityTemplate } from '../../externalServices/entityTemplateManager';
import { trycatch } from '../../utils/lib';
import { IFilterOfField, IFilterOfTemplate, ISearchBatchFilter, ISearchBatchBody } from './interface';
import { RelationshipsTemplateManagerService } from '../../externalServices/relationshipTemplateManager';
import { addDefaultFieldsToTemplate } from '../../utils/addDefaultsFieldsToEntityTemplate';

const { neo4j } = config;

const ajv = new Ajv();

ajv.addFormat('fileId', /.*/);
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);
ajv.addKeyword({
    keyword: 'dateNotification',
    type: 'string',
});

ajv.addKeyword({
    keyword: 'serialStarter',
    type: 'number',
});
ajv.addKeyword({
    keyword: 'serialCurrent',
    type: 'number',
});

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
    return formatFnsInTimeZone(date, 'Asia/Jerusalem', 'dd/MM/yyyy, HH:mm:ss');
};
export const formatDateForFullTextSearch = (date: Date) => {
    return formatFns(date, 'dd/MM/yyyy');
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

const strictIsValidDateString = (dateString: string, expectedFormat: string) => {
    const parsedDate = parse(dateString, expectedFormat, new Date());
    return isValidDate(parsedDate) && dateString === formatFns(parsedDate, expectedFormat);
};

const validateSimplePartFilterOfField = (rhs: boolean | string | number | null, templateOfField: IEntitySingleProperty, path: string) => {
    if (rhs === null) return;

    const { type, format } = templateOfField;

    if (type === 'string' && format === 'date-time') {
        const isValid = strictIsValidDateString(rhs as string, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        if (!isValid) throw new ValidationError(`filter on field ${path} should be of date-time format (isostring)`);
    }
    if (type === 'string' && format === 'date') {
        const isValid = strictIsValidDateString(rhs as string, 'yyyy-MM-dd');
        if (!isValid) throw new ValidationError(`filter on field ${path} should be of date format (yyyy-MM-dd)`);
    }

    if (typeof rhs !== templateOfField.type) throw new ValidationError(`filter on field ${path} should be of type ${templateOfField.type}`);
};

const validateFilterOfField = (filterOfField: IFilterOfField, templateOfField: IEntitySingleProperty, path: string) => {
    if (filterOfField.$eq) validateSimplePartFilterOfField(filterOfField.$eq, templateOfField, `${path}.$eq`);
    if (filterOfField.$ne) validateSimplePartFilterOfField(filterOfField.$ne, templateOfField, `${path}.$ne`);
    if (filterOfField.$eqi) {
        validateSimplePartFilterOfField(filterOfField.$eqi, templateOfField, `${path}.$eqi`);
        if (typeof templateOfField.type !== 'string' || templateOfField.format === 'date' || templateOfField.format === 'date-time') {
            throw new ValidationError(`filter of $eqi on field ${path} is invalid. must be on field of type string`);
        }
    }
    if (filterOfField.$gt) validateSimplePartFilterOfField(filterOfField.$gt, templateOfField, `${path}.$gt`);
    if (filterOfField.$gte) validateSimplePartFilterOfField(filterOfField.$gte, templateOfField, `${path}.$gte`);
    if (filterOfField.$lt) validateSimplePartFilterOfField(filterOfField.$lt, templateOfField, `${path}.$lt`);
    if (filterOfField.$lte) validateSimplePartFilterOfField(filterOfField.$lte, templateOfField, `${path}.$lte`);
    if (filterOfField.$in) {
        filterOfField.$in.forEach((inItem, index) => validateSimplePartFilterOfField(inItem, templateOfField, `${path}.$in.${index}`));
    }
};

const validateFilterOfTemplate = (filterOfTemplate: IFilterOfTemplate, template: IMongoEntityTemplate, path: string) => {
    Object.entries(filterOfTemplate).forEach(([field, filterOfField]) => {
        if (!filterOfField) return;

        if (!template.propertiesOrder.includes(field)) throw new ValidationError(`field ${path}.${field} doesnt exist in template`);
        validateFilterOfField(filterOfField, template.properties.properties[field], `${path}.${field}`);
    });
};

const validateFilter = (filter: ISearchBatchFilter, template: IMongoEntityTemplate, path: string) => {
    const { $or, $and } = filter;
    if ($or) {
        $or.forEach((orPart, index) => validateFilterOfTemplate(orPart, template, `${path}.${template._id}.$or.${index}`));
    }

    if (!$and) return;

    if (Array.isArray($and)) {
        $and.forEach((andPart, index) => validateFilterOfTemplate(andPart, template, `${path}.${template._id}.$and.${index}`));
    } else {
        validateFilterOfTemplate($and, template, `${path}.${template._id}.$and`);
    }
};

const validateSort = (searchBody: ISearchBatchBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>) => {
    const templateIds = Object.keys(searchBody.templates);

    searchBody.sort.forEach(({ field }, sortIndex) => {
        templateIds.forEach((templateId, templateIndex) => {
            const fieldTemplate = entityTemplatesMap.get(templateId)!.properties.properties[field];
            if (!fieldTemplate) {
                throw new ValidationError(
                    `sort.${sortIndex}.field "${field}" must exist in all templates of search, but doesnt exist in template id "${templateId}"`,
                );
            }

            if (templateIndex === 0) return;
            const prevTemplateId = templateIds[templateIndex - 1];
            const prevFieldTemplate = entityTemplatesMap.get(prevTemplateId)!.properties.properties[field];

            let isSameTypeAsPrevTemplate = fieldTemplate.type === prevFieldTemplate.type;

            const isFieldTemplateFromDateFormats = fieldTemplate.format && ['date-time', 'date'].includes(fieldTemplate.format);
            const isPrevFieldTemplateFromDateFormats = prevFieldTemplate.format && ['date-time', 'date'].includes(prevFieldTemplate.format);
            if (isFieldTemplateFromDateFormats || isPrevFieldTemplateFromDateFormats) {
                // only for date formats must be the same for sorting. because date formats are saved differently on Neo4j
                isSameTypeAsPrevTemplate = isSameTypeAsPrevTemplate && fieldTemplate.format === prevFieldTemplate.format;
            }
            if (!isSameTypeAsPrevTemplate) {
                throw new ValidationError(
                    `sort.${sortIndex}.field "${field}" must be the same type in all templates of search, but for example has different type/format in templates "${prevTemplateId}" and "${templateId}"`,
                );
            }
        });
    });
};

export const validateSearchBody = async (req: Request) => {
    const searchBody: ISearchBatchBody = req.body;
    const templateIds = Object.keys(searchBody.templates);
    const entityTemplates = await EntityTemplateManagerService.searchEntityTemplates({ ids: templateIds });
    if (entityTemplates.length < templateIds.length) {
        throw new ValidationError(`some of the templates in search doesnt exist. found only [${entityTemplates.map(({ _id }) => _id)}]`);
    }
    const entityTemplatesMap = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));
    const entityTemplatesForValidationMap = new Map(
        entityTemplates.map((entityTemplate) => [entityTemplate._id, addDefaultFieldsToTemplate(entityTemplate)]),
    );

    const [relationshipTemplatesAsSource, relationshipTemplatesAsDestination] = await Promise.all([
        RelationshipsTemplateManagerService.searchRelationshipTemplates({ sourceEntityIds: templateIds }),
        RelationshipsTemplateManagerService.searchRelationshipTemplates({ destinationEntityIds: templateIds }),
    ]);
    const relationshipTemplates = [...relationshipTemplatesAsSource, ...relationshipTemplatesAsDestination];
    const relationshipTemplatesMap = new Map(relationshipTemplates.map((relationshipTemplate) => [relationshipTemplate._id, relationshipTemplate]));

    Object.entries(searchBody.templates).forEach(([templateId, { filter, showRelationships }]) => {
        if (filter) validateFilter(filter, entityTemplatesForValidationMap.get(templateId)!, 'templates');

        if (typeof showRelationships !== 'boolean') {
            showRelationships.forEach((relationshipTemplateId, i) => {
                const relationshipTemplate = relationshipTemplatesMap.get(relationshipTemplateId);

                const relationshipHasEntityAsSourceOrDest = [
                    relationshipTemplate?.sourceEntityId,
                    relationshipTemplate?.destinationEntityId,
                ].includes(templateId);
                if (!relationshipTemplate || !relationshipHasEntityAsSourceOrDest) {
                    throw new ValidationError(
                        `relationship template id "${relationshipTemplateId}" doesnt exist in templates.${templateId}.showRelationships.${i}`,
                    );
                }
            });
        }
    });

    validateSort(searchBody, entityTemplatesForValidationMap);

    addPropertyToRequest(req, 'entityTemplatesMap', entityTemplatesMap);
};
