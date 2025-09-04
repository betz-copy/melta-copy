import {
    ActionErrors,
    addPropertyToRequest,
    CoordinateSystem,
    FilterLogicalOperator,
    getFilterFromChildTemplate,
    IEntitySingleProperty,
    IFilterGroup,
    IFilterOfField,
    IMongoEntityTemplate,
    IMongoRelationshipTemplate,
    ISearchBatchBody,
    ISearchEntitiesByTemplatesBody,
    ISearchEntitiesOfTemplateBody,
    ISearchFilter,
    IUniqueConstraintOfTemplate,
    matchValueAgainstFilter,
    ValidationError,
} from '@microservices/shared';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import axios from 'axios';
import { isValid as isValidDate, parse } from 'date-fns';
import { format as formatFns, formatInTimeZone as formatFnsInTimeZone } from 'date-fns-tz';
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import FilterValidation from '../../error';
import ChildTemplateManagerService from '../../externalServices/templates/childTemplateManager';
import EntityTemplateManagerService from '../../externalServices/templates/entityTemplateManager';
import RelationshipsTemplateManagerService from '../../externalServices/templates/relationshipTemplateManager';
import addDefaultFieldsToTemplate from '../../utils/addDefaultsFieldsToEntityTemplate';
import DefaultController from '../../utils/express/controller';
import { trycatch } from '../../utils/lib';
import { getNeo4jDate, getNeo4jDateTime, getNeo4jLocation } from '../../utils/neo4j/lib';
import { IGetExpandedEntityBody } from './interface';

const { neo4j, ajvCustomFormats, timezone } = config;

const ajv = new Ajv();

ajv.addFormat('fileId', ajvCustomFormats.fileIdFieldRegex);
ajv.addFormat('signature', ajvCustomFormats.signatureFieldRegex);
ajv.addFormat('comment', ajvCustomFormats.commentFieldRegex);
ajv.addFormat('user', {
    type: 'string',
    validate: (user) => {
        const userObj = JSON.parse(user);
        return userObj._id && userObj.fullName && userObj.jobTitle && userObj.hierarchy && userObj.mail;
    },
});
ajv.addFormat('kartoffelUserField', /.*/);
ajv.addFormat('unitField', /.*/);
ajv.addFormat('text-area', ajvCustomFormats.textAreaFieldRegex);
ajv.addFormat('relationshipReference', ajvCustomFormats.relationshipReferenceFieldRegex);
ajv.addFormat('location', {
    type: 'string',
    validate: (location) => {
        const locationObj = JSON.parse(location);
        return (
            locationObj.location && (locationObj.coordinateSystem === CoordinateSystem.UTM || locationObj.coordinateSystem === CoordinateSystem.WGS84)
        );
    },
});

addFormats(ajv);
ajv.addVocabulary(['patternCustomErrorMessage', 'hide']);
ajv.addKeyword({
    keyword: 'dateNotification',
    type: 'number',
});
ajv.addKeyword({ keyword: 'calculateTime', type: 'boolean' });
ajv.addKeyword({ keyword: 'isDailyAlert', type: 'boolean' });
ajv.addKeyword({ keyword: 'isDatePastAlert', type: 'boolean' });
ajv.addKeyword({ keyword: 'archive', type: 'boolean' });
ajv.addKeyword({ keyword: 'identifier', type: 'boolean' });
ajv.addKeyword({ keyword: 'hideFromDetailsPage', type: 'boolean' });
ajv.addKeyword({ keyword: 'comment', type: 'string' });
ajv.addKeyword({ keyword: 'color', type: 'string' });
ajv.addKeyword({
    keyword: 'serialStarter',
    type: 'number',
});
ajv.addKeyword({ keyword: 'user', type: 'string' });
ajv.addKeyword({ keyword: 'expandedUserField', type: 'string' });
ajv.addKeyword({
    keyword: 'relationshipReference',
    type: 'string',
});
ajv.addKeyword({
    keyword: 'serialCurrent',
    type: 'number',
});

export class EntityValidator extends DefaultController {
    private entityTemplateManagerService: EntityTemplateManagerService;

    private relationshipsTemplateManagerService: RelationshipsTemplateManagerService;

    private childTemplateManagerService: ChildTemplateManagerService;

    constructor(workspaceId: string) {
        super(undefined);

        this.entityTemplateManagerService = new EntityTemplateManagerService(workspaceId);
        this.relationshipsTemplateManagerService = new RelationshipsTemplateManagerService(workspaceId);
        this.childTemplateManagerService = new ChildTemplateManagerService(workspaceId);
    }

    private async getEntityTemplateByIdOrThrowValidationError(templateId: string) {
        const { result: entityTemplate, err: getEntityTemplateByIdErr } = await trycatch(() =>
            this.entityTemplateManagerService.getEntityTemplateById(templateId),
        );
        if (getEntityTemplateByIdErr || !entityTemplate) {
            if (axios.isAxiosError(getEntityTemplateByIdErr) && getEntityTemplateByIdErr.response?.status === StatusCodes.NOT_FOUND)
                throw new ValidationError(`Entity template doesn't exist (id: "${templateId}")`);

            throw getEntityTemplateByIdErr;
        }

        return entityTemplate;
    }

    // private validateColoredFields(coloredFields: Record<string, string> | undefined, properties: Record<string, any>) {
    //     if (!coloredFields) return;
    //     const keyError = Object.keys(coloredFields).find((key) => !Object.keys(properties).includes(key));
    //     if (keyError) throw new ValidationError(`colored field "${keyError}" do not exist in properties`);
    // }
    // TODO: use it / delete it

    validateEntity(entityTemplate: IMongoEntityTemplate, properties: Record<string, any>) {
        const validateFunction = ajv.compile(entityTemplate.properties);
        const valid = validateFunction(properties);

        if (!valid) {
            const errors = validateFunction.errors?.map((error) => ({
                type: ActionErrors.validation,
                metadata: {
                    message: error.message,
                    path: error.instancePath,
                    schemaPath: error.schemaPath,
                    params: error.params,
                },
            }));

            throw new ValidationError(`Entity does not match template schema`, {
                properties,
                errors: errors || [],
            });
        }
    }

    async getChildFilters(childTemplateId: string): Promise<ISearchFilter | undefined> {
        const childTemplate = await this.childTemplateManagerService.getChildTemplateById(childTemplateId);
        return getFilterFromChildTemplate(childTemplate);
    }

    validatePropertiesMatchFilters(properties: Record<string, any>, filter?: ISearchFilter) {
        const notValidKey = matchValueAgainstFilter(properties, filter);
        if (notValidKey)
            throw new FilterValidation(`Property ${notValidKey} do not match the filter`, {
                properties,
                errors: [
                    {
                        type: ActionErrors.validation,
                        metadata: {
                            message: `FilterValidationError: Property ${notValidKey} do not match the filter`,
                            path: `/${notValidKey}`,
                            schemaPath: `/${notValidKey}`,
                            params: {},
                        },
                    },
                ],
            });
    }

    async validateEntityRequest(req: Request) {
        const { templateId, properties, childTemplateId } = req.body;

        const entityTemplate = await this.getEntityTemplateByIdOrThrowValidationError(templateId);

        this.validateEntity(entityTemplate, properties);

        if (childTemplateId) {
            const filter = await this.getChildFilters(childTemplateId);
            this.validatePropertiesMatchFilters(req.body.properties, filter);
        }
        addPropertyToRequest(req, 'entityTemplate', entityTemplate);
    }

    async validateTemplateExistence(req: Request) {
        const entityTemplate = await this.getEntityTemplateByIdOrThrowValidationError(req.body.templateId);
        addPropertyToRequest(req, 'entityTemplate', entityTemplate);
    }

    async validateConstraintsOfTemplate(req: Request) {
        const entityTemplate = await this.getEntityTemplateByIdOrThrowValidationError(req.params.templateId);

        const { properties } = entityTemplate;
        const propertiesKeys = Object.keys(properties.properties);

        const { requiredConstraints, uniqueConstraints }: { requiredConstraints: string[]; uniqueConstraints: IUniqueConstraintOfTemplate[] } =
            req.body;

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
            const uniqueConstraintPropertyThatIsNotInRequired = uniqueConstraint.properties.find(
                (property) => !requiredConstraints.includes(property),
            );

            if (uniqueConstraintPropertyThatIsNotInRequired) {
                // because neo4j 4.0 supports unique constraints but makes them required too
                throw new ValidationError(
                    `property ${uniqueConstraintPropertyThatIsNotInRequired} is in unique constraint, so it must be in required too`,
                );
            }
        });

        addPropertyToRequest(req, 'entityTemplate', entityTemplate);
    }

    private strictIsValidDateString(dateString: string, expectedFormat: string) {
        if (neo4j.relativeDateFilters.includes(dateString)) return true;

        const parsedDate = parse(dateString, expectedFormat, new Date());
        return isValidDate(parsedDate) && dateString === formatFns(parsedDate, expectedFormat);
    }

    private validateSimplePartFilterOfField(rhs: boolean | string | number | RegExp | null, templateOfField: IEntitySingleProperty, path: string) {
        if (rhs === null) return;

        const { type, format } = templateOfField;
        if (type === 'string' && format === 'date-time') {
            const isValid = this.strictIsValidDateString(rhs as string, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
            if (!isValid) throw new ValidationError(`filter on field ${path} should be of date-time format (isostring)`);
            return;
        }
        if (type === 'string' && format === 'date') {
            const isValid = this.strictIsValidDateString(rhs as string, 'yyyy-MM-dd');
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
    }

    private validateStrictStringFilterOfField(rhs: string, templateOfField: IEntitySingleProperty, path: string) {
        this.validateSimplePartFilterOfField(rhs, templateOfField, path);
        if (typeof templateOfField.type !== 'string' || templateOfField.format === 'date' || templateOfField.format === 'date-time') {
            throw new ValidationError(`filter on field ${path} is invalid. must be on field of type strict string (not date format)`);
        }
    }

    private validateFilterOfField(filterOfField: IFilterOfField, templateOfField: IEntitySingleProperty, path: string) {
        if (filterOfField.$eq) this.validateSimplePartFilterOfField(filterOfField.$eq, templateOfField, `${path}.$eq`);
        if (filterOfField.$ne) this.validateSimplePartFilterOfField(filterOfField.$ne, templateOfField, `${path}.$ne`);
        if (filterOfField.$gt) this.validateSimplePartFilterOfField(filterOfField.$gt, templateOfField, `${path}.$gt`);
        if (filterOfField.$gte) this.validateSimplePartFilterOfField(filterOfField.$gte, templateOfField, `${path}.$gte`);
        if (filterOfField.$lt) this.validateSimplePartFilterOfField(filterOfField.$lt, templateOfField, `${path}.$lt`);
        if (filterOfField.$lte) this.validateSimplePartFilterOfField(filterOfField.$lte, templateOfField, `${path}.$lte`);

        if (filterOfField.$eqi) this.validateStrictStringFilterOfField(filterOfField.$eqi, templateOfField, `${path}.$eqi`);
        if (filterOfField.$rgx) this.validateStrictStringFilterOfField(filterOfField.$rgx, templateOfField, `${path}.$rgx`);

        if (filterOfField.$in) {
            filterOfField.$in.forEach((inItem, index) => this.validateSimplePartFilterOfField(inItem, templateOfField, `${path}.$in.${index}`));
        }

        if (filterOfField.$not) {
            this.validateFilterOfField(filterOfField.$not, templateOfField, `${path}.$not`);
        }
    }

    private validateFilterOfTemplate(filterOfTemplate: IFilterGroup, template: IMongoEntityTemplate, path: string) {
        Object.entries(filterOfTemplate).forEach(([filterKey, filterOfField]) => {
            if (!filterOfField) return;

            if (filterKey === FilterLogicalOperator.AND || filterKey === FilterLogicalOperator.OR) {
                if (Array.isArray(filterOfField)) {
                    filterOfField.map((currFilterOfTemplate, i) =>
                        this.validateFilterOfTemplate(currFilterOfTemplate, template, `${path}.\`${filterKey}\`[${i}]`),
                    );
                    return;
                }
                this.validateFilterOfTemplate(filterOfField, template, `${path}.\`$and\``);
                return;
            }

            if (!template.propertiesOrder.includes(filterKey)) throw new ValidationError(`field ${path}.${filterKey} doesnt exist in template`);
            this.validateFilterOfField(filterOfField, template.properties.properties[filterKey], `${path}.${filterKey}`);
        });
    }

    private validateFilter(
        filter: ISearchFilter,
        template: IMongoEntityTemplate,
        pathOfFilterField: string, // to show origin of error if throwing
    ) {
        const { $or, $and } = filter;
        if ($or) {
            $or.forEach((orPart, index) => this.validateFilterOfTemplate(orPart, template, `${pathOfFilterField}.$or.${index}`));
        }
        if (!$and) return;
        if (Array.isArray($and)) {
            $and.forEach((andPart, index) => this.validateFilterOfTemplate(andPart, template, `${pathOfFilterField}.$and.${index}`));
        } else {
            this.validateFilterOfTemplate($and, template, `${pathOfFilterField}.$and`);
        }
    }

    private validateSortOfSearchBatch(searchBody: ISearchBatchBody, entityTemplatesMap: Map<string, IMongoEntityTemplate>) {
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
    }

    private async getRelationshipTemplatesRelatedToEntityTemplates(entityTemplateIds: string[]) {
        const [relationshipTemplatesAsSource, relationshipTemplatesAsDestination] = await Promise.all([
            this.relationshipsTemplateManagerService.searchRelationshipTemplates({ sourceEntityIds: entityTemplateIds }),
            this.relationshipsTemplateManagerService.searchRelationshipTemplates({ destinationEntityIds: entityTemplateIds }),
        ]);
        const relationshipTemplates = [...relationshipTemplatesAsSource, ...relationshipTemplatesAsDestination];
        const relationshipTemplatesMap = new Map(
            relationshipTemplates.map((relationshipTemplate) => [relationshipTemplate._id, relationshipTemplate]),
        );

        return relationshipTemplatesMap;
    }

    private validateShowRelationships(
        showRelationships: boolean | string[],
        entityTemplateId: string,
        relationshipTemplatesMap: Map<string, IMongoRelationshipTemplate>,
        pathOfShowRelationshipsField: string, // to show origin of error if throwing
    ) {
        if (typeof showRelationships === 'boolean') return;

        showRelationships.forEach((relationshipTemplateId, i) => {
            const relationshipTemplate = relationshipTemplatesMap.get(relationshipTemplateId);

            const relationshipHasEntityAsSourceOrDest = [relationshipTemplate?.sourceEntityId, relationshipTemplate?.destinationEntityId].includes(
                entityTemplateId,
            );
            if (!relationshipTemplate || !relationshipHasEntityAsSourceOrDest) {
                throw new ValidationError(
                    `relationship template id "${relationshipTemplateId}" doesnt exist in ${pathOfShowRelationshipsField}.${i}`,
                );
            }
        });
    }

    async validateSearchEntitiesOfTemplateBody(req: Request) {
        const { filter, showRelationships, sort }: ISearchEntitiesOfTemplateBody = req.body;
        const { templateId } = req.params;

        const entityTemplate = await this.getEntityTemplateByIdOrThrowValidationError(templateId);
        const entityTemplateForValidation = addDefaultFieldsToTemplate(entityTemplate);

        const relationshipTemplatesMap = await this.getRelationshipTemplatesRelatedToEntityTemplates([templateId]);

        if (filter) this.validateFilterOfTemplate(filter, entityTemplateForValidation, 'filter');

        this.validateShowRelationships(showRelationships, templateId, relationshipTemplatesMap, 'showRelationships');

        sort?.forEach(({ field }, sortIndex) => {
            const fieldTemplate = entityTemplateForValidation.properties.properties[field];
            if (!fieldTemplate) {
                throw new ValidationError(`sort.${sortIndex}.field "${field}" must exist in template of search`);
            }
        });

        addPropertyToRequest(req, 'entityTemplate', entityTemplate);
    }

    async validateSearchByTemplatesBody(req: Request) {
        const { searchConfigs }: ISearchEntitiesByTemplatesBody = req.body;
        const templateIds = Object.keys(searchConfigs);
        const entityTemplates = await this.entityTemplateManagerService.searchEntityTemplates({ ids: templateIds });
        if (entityTemplates.length < templateIds.length) {
            throw new ValidationError(`some of the templates in search doesnt exist. found only [${entityTemplates.map(({ _id }) => _id)}]`);
        }
        const entityTemplatesMap = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));

        const entityTemplatesForValidationMap: Map<string, IMongoEntityTemplate> = new Map(
            entityTemplates.map((entityTemplate) => [entityTemplate._id, addDefaultFieldsToTemplate(entityTemplate)]),
        );

        const relationshipTemplatesMap = await this.getRelationshipTemplatesRelatedToEntityTemplates(templateIds);

        Object.entries(searchConfigs).forEach(([templateId, { filter, showRelationships, sort }]) => {
            if (filter) this.validateFilter(filter, entityTemplatesForValidationMap.get(templateId)!, `searchConfigs.${templateId}.filter`);

            this.validateShowRelationships(showRelationships, templateId, relationshipTemplatesMap, `searchConfigs.${templateId}.showRelationships`);

            sort?.forEach(({ field }, sortIndex) => {
                const fieldTemplate = entityTemplatesForValidationMap.get(templateId)!.properties.properties[field];
                if (!fieldTemplate) {
                    throw new ValidationError(`sort.${sortIndex}.field "${field}" must exist in template of search`);
                }
            });
        });

        addPropertyToRequest(req, 'entityTemplatesMap', entityTemplatesMap);
    }

    async validateSearchBatchBody(req: Request) {
        const searchBody: ISearchBatchBody = req.body;
        const templateIds = Object.keys(searchBody.templates);
        const entityTemplates = await this.entityTemplateManagerService.searchEntityTemplates({ ids: templateIds });
        if (entityTemplates.length < templateIds.length) {
            throw new ValidationError(`some of the templates in search doesnt exist. found only [${entityTemplates.map(({ _id }) => _id)}]`);
        }
        const entityTemplatesMap = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));

        const entityTemplatesForValidationMap: Map<string, IMongoEntityTemplate> = new Map(
            entityTemplates.map((entityTemplate) => [entityTemplate._id, addDefaultFieldsToTemplate(entityTemplate)]),
        );

        const relationshipTemplatesMap = await this.getRelationshipTemplatesRelatedToEntityTemplates(templateIds);

        Object.entries(searchBody.templates).forEach(([templateId, { filter, showRelationships }]) => {
            if (filter) this.validateFilter(filter, entityTemplatesForValidationMap.get(templateId)!, `templates.${templateId}.filter`);

            this.validateShowRelationships(showRelationships, templateId, relationshipTemplatesMap, `templates.${templateId}.showRelationships`);
        });

        this.validateSortOfSearchBatch(searchBody, entityTemplatesForValidationMap);

        addPropertyToRequest(req, 'entityTemplatesMap', entityTemplatesMap);
    }

    async validateFilterBatchBody(req: Request) {
        const searchBody: IGetExpandedEntityBody['filters'] = req.body.filters;
        const templateIds = Object.keys(searchBody);
        const entityTemplates = await this.entityTemplateManagerService.searchEntityTemplates({ ids: templateIds });
        if (entityTemplates.length < templateIds.length) {
            throw new ValidationError(`some of the templates in search doesn't exist. found only [${entityTemplates.map(({ _id }) => _id)}]`);
        }
        const entityTemplatesMap = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));

        const entityTemplatesForValidationMap: Map<string, IMongoEntityTemplate> = new Map(
            entityTemplates.map((entityTemplate) => [entityTemplate._id, addDefaultFieldsToTemplate(entityTemplate)]),
        );
        Object.entries(searchBody).forEach(([templateId, { filter }]) => {
            if (filter) {
                this.validateFilter(filter, entityTemplatesForValidationMap.get(templateId)!, `filters.${templateId}.filter`);
            }
        });
        addPropertyToRequest(req, 'entityTemplatesMap', entityTemplatesMap);
    }
}

// same format as dates shown in UI
const formatDateTimeForFullTextSearch = (date: Date) => {
    return formatFnsInTimeZone(date, timezone, 'dd/MM/yyyy, HH:mm:ss');
};

const formatDateForFullTextSearch = (date: Date) => {
    return formatFns(date, 'dd/MM/yyyy');
};

export const getFileName = (fileId: string): string => {
    return fileId.slice(config.fileIdLength);
};

export const getFilesName = (files: string[]): string => {
    const fileNames = files.map((fileId: string) => getFileName(fileId));

    return fileNames.join(', ');
};

/**
 * Prepares the entityProperties to be inserted to neo4j.
 * Adds suffixes to special keys (such as booleans and users)
 * And changes some of the values to strings (dates, users, bools etc...)
 * @param recursiveRelationshipReference
 * @returns flattened entity (i.e. an object with no nested properties, using key paths as keys).
 */
export const addStringFieldsAndNormalizeSpecialStringValues = async (
    entityProperties: Record<string, any>,
    entityTemplate: IMongoEntityTemplate,
    entityTemplateService: EntityTemplateManagerService,
    coloredFields?: Record<string, string>,
    recursiveRelationshipReference = false,
): Promise<Record<string, any>> => {
    const normalizedEntity: Record<string, any> = {};

    await Promise.all(
        Object.entries(entityTemplate.properties.properties).map(async ([key, value]) => {
            if (Object.keys(coloredFields ?? {}).includes(key)) normalizedEntity[`${key}${neo4j.colorPropertySuffix}`] = coloredFields?.[key];

            if (!(key in entityProperties)) {
                if (value.type === 'boolean') {
                    normalizedEntity[key] = false;
                    normalizedEntity[`${key}${neo4j.booleanPropertySuffix}`] = neo4j.booleanHeNoValue;
                }
                return;
            }

            const propertyValue = entityProperties[key];
            const { type, format, items } = value;

            if (format === 'user') {
                config.neo4j.userOriginalAndSuffixFieldsMap.forEach(({ suffixFieldName, originalFieldName }) => {
                    normalizedEntity[`${key}${suffixFieldName}${config.neo4j.userFieldPropertySuffix}`] =
                        JSON.parse(propertyValue)[originalFieldName];
                });
                return;
            }

            if (type === 'array' && items?.format === 'user') {
                config.neo4j.usersArrayOriginalAndSuffixFieldsMap.forEach(({ suffixFieldName, originalFieldName }) => {
                    normalizedEntity[`${key}${suffixFieldName}${config.neo4j.usersFieldsPropertySuffix}`] = propertyValue.map(
                        (user: string) => JSON.parse(user)[originalFieldName],
                    );
                });
                return;
            }

            // For Neo4j fulltext search (supports only string properties)
            if (type !== 'string') {
                normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = String(propertyValue);
            }

            if (type === 'boolean') {
                normalizedEntity[`${key}${neo4j.booleanPropertySuffix}`] = propertyValue ? neo4j.booleanHeYesValue : neo4j.booleanHeNoValue;
            }

            if (type === 'array' && items?.format === 'fileId') {
                normalizedEntity[`${key}${neo4j.filePropertySuffix}`] = propertyValue.map((fileId: string) => getFileName(fileId));
            }

            if (type === 'string' && (format === 'fileId' || format === 'signature')) {
                normalizedEntity[`${key}${neo4j.filePropertySuffix}`] = getFileName(propertyValue);
            }

            if (type === 'string' && format === 'date') {
                const date = new Date(propertyValue);
                normalizedEntity[key] = getNeo4jDate(date);
                normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = formatDateForFullTextSearch(date);
                return;
            }

            if (type === 'string' && format === 'date-time') {
                const dateTime = new Date(propertyValue);
                normalizedEntity[key] = getNeo4jDateTime(dateTime);
                normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = formatDateTimeForFullTextSearch(dateTime);
                return;
            }

            if (type === 'string' && format === 'relationshipReference' && typeof propertyValue === 'object') {
                let relationShipPropValue: Record<string, any> = propertyValue;

                if (recursiveRelationshipReference) {
                    const relatedEntityTemplate = await entityTemplateService.getEntityTemplateById(propertyValue.templateId);

                    const hasNestedRelationship = Object.values(relatedEntityTemplate.properties.properties).some(
                        ({ format: nestedFormat }) => nestedFormat === 'relationshipReference',
                    );

                    relationShipPropValue = await addStringFieldsAndNormalizeSpecialStringValues(
                        propertyValue.properties,
                        relatedEntityTemplate,
                        entityTemplateService,
                        coloredFields,
                        hasNestedRelationship,
                    );
                }

                normalizedEntity[`${key}.templateId${neo4j.relationshipReferencePropertySuffix}`] = value.relationshipReference!.relatedTemplateId;
                Object.entries(relationShipPropValue).forEach(([innerKey, innerProperty]) => {
                    normalizedEntity[`${key}.properties.${innerKey}${neo4j.relationshipReferencePropertySuffix}`] = innerProperty;
                });

                return;
            }

            if (type === 'string' && format === 'location') {
                const location = typeof propertyValue === 'string' ? JSON.parse(propertyValue) : propertyValue;
                normalizedEntity[key] = getNeo4jLocation(location.location, entityProperties, key);
                normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = location.location;
                normalizedEntity[`${key}${neo4j.locationCoordinateSystemSuffix}`] = location.coordinateSystem;
                return;
            }

            normalizedEntity[key] = propertyValue;
        }),
    );

    return normalizedEntity;
};
