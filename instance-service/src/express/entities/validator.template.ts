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
import {
    IFilterOfField,
    IFilterOfTemplate,
    ISearchFilter,
    ISearchBatchBody,
    ISearchEntitiesOfTemplateBody,
    IUniqueConstraintOfTemplate,
    IGetExpandedEntityBody,
} from './interface';
import { IMongoRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/relationshipTemplateManager';
import { addDefaultFieldsToTemplate } from '../../utils/addDefaultsFieldsToEntityTemplate';

const { neo4j } = config;

const ajv = new Ajv();

ajv.addFormat('fileId', /.*/);
ajv.addFormat('text-area', /.*/);
addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);
ajv.addKeyword({
    keyword: 'dateNotification',
    type: 'string',
});
ajv.addKeyword({ keyword: 'calculateTime', type: 'boolean' });
ajv.addKeyword({
    keyword: 'serialStarter',
    type: 'number',
});
ajv.addKeyword({
    keyword: 'serialCurrent',
    type: 'number',
});

export const getEntityTemplateByIdOrThrowValidationError = async (templateId: string) => {
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
            if (value.type === 'boolean') normalizedEntity[key] = false;
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

    const { requiredConstraints, uniqueConstraints }: { requiredConstraints: string[]; uniqueConstraints: IUniqueConstraintOfTemplate[] } = req.body;

    requiredConstraints.forEach((constraintProp) => {
        const isConstraintPropertyUnknown = !propertiesKeys.includes(constraintProp);
        if (isConstraintPropertyUnknown) {
            throw new ValidationError(`required constraint of ${constraintProp} is unknown in template`);
        }
    });
    uniqueConstraints.forEach((constraintProps) => {
        const unknownPropertyInConstraint = constraintProps.properties.find((property) => !propertiesKeys.includes(property));
        if (unknownPropertyInConstraint) {
            throw new ValidationError(
                `unique constraint of ${constraintProps} contains unknown property "${unknownPropertyInConstraint}" in template`,
            );
        }
    });

    uniqueConstraints.forEach((uniqueConstraint) => {
        const uniqueConstraintPropertyThatIsNotInRequired = uniqueConstraint.properties.find((property) => !requiredConstraints.includes(property));

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
        return;
    }
    if (type === 'string' && format === 'date') {
        const isValid = strictIsValidDateString(rhs as string, 'yyyy-MM-dd');
        if (!isValid) throw new ValidationError(`filter on field ${path} should be of date format (yyyy-MM-dd)`);
        return;
    }

    if (type === 'array') {
        if (typeof rhs !== templateOfField.items!.type) {
            throw new ValidationError(`filter on field ${path} should be of type ${templateOfField.items!.type} (the array's items type)`);
        }
        return;
    }

    if (typeof rhs !== templateOfField.type) throw new ValidationError(`filter on field ${path} should be of type ${templateOfField.type}`);
};

const validateStrictStringFilterOfField = (rhs: string, templateOfField: IEntitySingleProperty, path: string) => {
    validateSimplePartFilterOfField(rhs, templateOfField, path);
    if (typeof templateOfField.type !== 'string' || templateOfField.format === 'date' || templateOfField.format === 'date-time') {
        throw new ValidationError(`filter on field ${path} is invalid. must be on field of type strict string (not date format)`);
    }
};

const validateFilterOfField = (filterOfField: IFilterOfField, templateOfField: IEntitySingleProperty, path: string) => {
    if (filterOfField.$eq) validateSimplePartFilterOfField(filterOfField.$eq, templateOfField, `${path}.$eq`);
    if (filterOfField.$ne) validateSimplePartFilterOfField(filterOfField.$ne, templateOfField, `${path}.$ne`);
    if (filterOfField.$gt) validateSimplePartFilterOfField(filterOfField.$gt, templateOfField, `${path}.$gt`);
    if (filterOfField.$gte) validateSimplePartFilterOfField(filterOfField.$gte, templateOfField, `${path}.$gte`);
    if (filterOfField.$lt) validateSimplePartFilterOfField(filterOfField.$lt, templateOfField, `${path}.$lt`);
    if (filterOfField.$lte) validateSimplePartFilterOfField(filterOfField.$lte, templateOfField, `${path}.$lte`);

    if (filterOfField.$eqi) validateStrictStringFilterOfField(filterOfField.$eqi, templateOfField, `${path}.$eqi`);
    if (filterOfField.$rgx) validateStrictStringFilterOfField(filterOfField.$rgx, templateOfField, `${path}.$rgx`);

    if (filterOfField.$in) {
        filterOfField.$in.forEach((inItem, index) => validateSimplePartFilterOfField(inItem, templateOfField, `${path}.$in.${index}`));
    }

    if (filterOfField.$not) {
        validateFilterOfField(filterOfField.$not, templateOfField, `${path}.$not`);
    }
};

const validateFilterOfTemplate = (filterOfTemplate: IFilterOfTemplate, template: IMongoEntityTemplate, path: string) => {
    Object.entries(filterOfTemplate).forEach(([field, filterOfField]) => {
        if (!filterOfField) return;

        if (!template.propertiesOrder.includes(field)) throw new ValidationError(`field ${path}.${field} doesnt exist in template`);
        validateFilterOfField(filterOfField, template.properties.properties[field], `${path}.${field}`);
    });
};

const validateFilter = (
    filter: ISearchFilter,
    template: IMongoEntityTemplate,
    pathOfFilterField: string, // to show origin of error if throwing
) => {
    const { $or, $and } = filter;
    if ($or) {
        $or.forEach((orPart, index) => validateFilterOfTemplate(orPart, template, `${pathOfFilterField}.$or.${index}`));
    }

    if (!$and) return;

    if (Array.isArray($and)) {
        $and.forEach((andPart, index) => validateFilterOfTemplate(andPart, template, `${pathOfFilterField}.$and.${index}`));
    } else {
        validateFilterOfTemplate($and, template, `${pathOfFilterField}.$and`);
    }
};

const validateSortOfSearchBatch = (searchBody: ISearchBatchBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>) => {
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

export const getRelationshipTemplatesRelatedToEntityTemplates = async (entityTemplateIds: string[]) => {
    const [relationshipTemplatesAsSource, relationshipTemplatesAsDestination] = await Promise.all([
        RelationshipsTemplateManagerService.searchRelationshipTemplates({ sourceEntityIds: entityTemplateIds }),
        RelationshipsTemplateManagerService.searchRelationshipTemplates({ destinationEntityIds: entityTemplateIds }),
    ]);
    const relationshipTemplates = [...relationshipTemplatesAsSource, ...relationshipTemplatesAsDestination];
    const relationshipTemplatesMap = new Map(relationshipTemplates.map((relationshipTemplate) => [relationshipTemplate._id, relationshipTemplate]));

    return relationshipTemplatesMap;
};

const validateShowRelationships = (
    showRelationships: boolean | string[],
    entityTemplateId: string,
    relationshipTemplatesMap: Map<string, IMongoRelationshipTemplate>,
    pathOfShowRelationshipsField: string, // to show origin of error if throwing
) => {
    if (typeof showRelationships === 'boolean') return;

    showRelationships.forEach((relationshipTemplateId, i) => {
        const relationshipTemplate = relationshipTemplatesMap.get(relationshipTemplateId);

        const relationshipHasEntityAsSourceOrDest = [relationshipTemplate?.sourceEntityId, relationshipTemplate?.destinationEntityId].includes(
            entityTemplateId,
        );
        if (!relationshipTemplate || !relationshipHasEntityAsSourceOrDest) {
            throw new ValidationError(`relationship template id "${relationshipTemplateId}" doesnt exist in ${pathOfShowRelationshipsField}.${i}`);
        }
    });
};

export const validateSearchEntitiesOfTemplateBody = async (req: Request) => {
    const { filter, showRelationships, sort }: ISearchEntitiesOfTemplateBody = req.body;
    const { templateId } = req.params;

    const entityTemplate = await getEntityTemplateByIdOrThrowValidationError(templateId);
    const entityTemplateForValidation = addDefaultFieldsToTemplate(entityTemplate);

    const relationshipTemplatesMap = await getRelationshipTemplatesRelatedToEntityTemplates([templateId]);

    if (filter) validateFilter(filter, entityTemplateForValidation, 'filter');

    validateShowRelationships(showRelationships, templateId, relationshipTemplatesMap, 'showRelationships');

    sort.forEach(({ field }, sortIndex) => {
        const fieldTemplate = entityTemplateForValidation.properties.properties[field];
        if (!fieldTemplate) {
            throw new ValidationError(`sort.${sortIndex}.field "${field}" must exist in template of search`);
        }
    });

    addPropertyToRequest(req, 'entityTemplate', entityTemplate);
};

export const validateSearchBatchBody = async (req: Request) => {
    const searchBody: ISearchBatchBody = req.body;
    const templateIds = Object.keys(searchBody.templates);
    const entityTemplates = await EntityTemplateManagerService.searchEntityTemplates({ ids: templateIds });
    if (entityTemplates.length < templateIds.length) {
        throw new ValidationError(`some of the templates in search doesnt exist. found only [${entityTemplates.map(({ _id }) => _id)}]`);
    }
    const entityTemplatesMap = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));

    const entityTemplatesForValidationMap: Map<string, IMongoEntityTemplate> = new Map(
        entityTemplates.map((entityTemplate) => [entityTemplate._id, addDefaultFieldsToTemplate(entityTemplate)]),
    );

    const relationshipTemplatesMap = await getRelationshipTemplatesRelatedToEntityTemplates(templateIds);

    Object.entries(searchBody.templates).forEach(([templateId, { filter, showRelationships }]) => {
        if (filter) validateFilter(filter, entityTemplatesForValidationMap.get(templateId)!, `templates.${templateId}.filter`);

        validateShowRelationships(showRelationships, templateId, relationshipTemplatesMap, `templates.${templateId}.showRelationships`);
    });

    validateSortOfSearchBatch(searchBody, entityTemplatesForValidationMap);

    addPropertyToRequest(req, 'entityTemplatesMap', entityTemplatesMap);
};

export const validateFilterBatchBody = async (req: Request) => {
    const searchBody: IGetExpandedEntityBody['filters'] = req.body.filters;
    const templateIds = Object.keys(searchBody);
    const entityTemplates = await EntityTemplateManagerService.searchEntityTemplates({ ids: templateIds });
    if (entityTemplates.length < templateIds.length) {
        throw new ValidationError(`some of the templates in search doesnt exist. found only [${entityTemplates.map(({ _id }) => _id)}]`);
    }
    const entityTemplatesMap = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));

    const entityTemplatesForValidationMap: Map<string, IMongoEntityTemplate> = new Map(
        entityTemplates.map((entityTemplate) => [entityTemplate._id, addDefaultFieldsToTemplate(entityTemplate)]),
    );
    Object.entries(searchBody).forEach(([templateId, { filter }]) => {
        if (filter) {
            validateFilter(filter, entityTemplatesForValidationMap.get(templateId)!, `filters.${templateId}.filter`);
        }
    });
    addPropertyToRequest(req, 'entityTemplatesMap', entityTemplatesMap);
};
