/* eslint-disable class-methods-use-this */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import axios from 'axios';
import { isValid as isValidDate, parse } from 'date-fns';
import { format as formatFns, formatInTimeZone as formatFnsInTimeZone } from 'date-fns-tz';
import { Request } from 'express';
import config from '../../config';
import { EntityTemplateManagerService, IEntitySingleProperty, IMongoEntityTemplate } from '../../externalServices/entityTemplateManager';
import { IMongoRelationshipTemplate, RelationshipsTemplateManagerService } from '../../externalServices/relationshipTemplateManager';
import { addDefaultFieldsToTemplate } from '../../utils/addDefaultsFieldsToEntityTemplate';
import { addPropertyToRequest } from '../../utils/express';
import { trycatch } from '../../utils/lib';
import { getNeo4jDate, getNeo4jDateTime } from '../../utils/neo4j/lib';
import { ValidationError } from '../error';
import { IFilterOfField, IFilterOfTemplate, ISearchBatchBody, ISearchEntitiesOfTemplateBody, ISearchFilter } from './interface';

const { neo4j } = config;

const ajv = new Ajv();

ajv.addFormat('fileId', /.*/);
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

export default class EntityValidator {
    private entityTemplateManagerService: EntityTemplateManagerService;

    private relationshipsTemplateManagerService: RelationshipsTemplateManagerService;

    constructor(dbName: string) {
        this.entityTemplateManagerService = new EntityTemplateManagerService(dbName);
        this.relationshipsTemplateManagerService = new RelationshipsTemplateManagerService(dbName);
    }

    private async getEntityTemplateByIdOrThrowValidationError(templateId: string) {
        const { result: entityTemplate, err: getEntityTemplateByIdErr } = await trycatch(() =>
            this.entityTemplateManagerService.getEntityTemplateById(templateId),
        );

        if (getEntityTemplateByIdErr || !entityTemplate) {
            if (axios.isAxiosError(getEntityTemplateByIdErr) && getEntityTemplateByIdErr.response?.status === 404) {
                throw new ValidationError(`Entity template doesnt exist (id: "${templateId}")`);
            }

            throw getEntityTemplateByIdErr;
        }

        return entityTemplate;
    }

    public async validateEntity(req: Request) {
        const entityTemplate = await this.getEntityTemplateByIdOrThrowValidationError(req.body.templateId);

        const validateFunction = ajv.compile(entityTemplate.properties);
        const valid = validateFunction(req.body.properties);

        if (!valid) {
            throw new ValidationError(`Entity does not match template schema: ${JSON.stringify(validateFunction.errors)}`);
        }

        addPropertyToRequest(req, 'entityTemplate', entityTemplate);
    }

    // same format as dates shown in UI
    public async formatDateTimeForFullTextSearch(date: Date) {
        return formatFnsInTimeZone(date, 'Asia/Jerusalem', 'dd/MM/yyyy, HH:mm:ss');
    }

    public async formatDateForFullTextSearch(date: Date) {
        return formatFns(date, 'dd/MM/yyyy');
    }

    public addStringFieldsAndNormalizeDateValues(entityProperties: Record<string, any>, entityTemplate: IMongoEntityTemplate): Record<string, any> {
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
                normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = this.formatDateForFullTextSearch(new Date(propertyValue));

                return;
            }

            if (type === 'string' && format === 'date-time') {
                normalizedEntity[key] = getNeo4jDateTime(new Date(propertyValue));
                normalizedEntity[`${key}${neo4j.stringPropertySuffix}`] = this.formatDateTimeForFullTextSearch(new Date(propertyValue));

                return;
            }

            normalizedEntity[key] = propertyValue;
        });

        return normalizedEntity;
    }

    public async validateConstraintsOfTemplate(req: Request) {
        const { properties } = await this.getEntityTemplateByIdOrThrowValidationError(req.params.templateId);
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
    }

    private strictIsValidDateString(dateString: string, expectedFormat: string) {
        const parsedDate = parse(dateString, expectedFormat, new Date());
        return isValidDate(parsedDate) && dateString === formatFns(parsedDate, expectedFormat);
    }

    private validateSimplePartFilterOfField(rhs: boolean | string | number | null, templateOfField: IEntitySingleProperty, path: string) {
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

    private validateFilterOfTemplate(filterOfTemplate: IFilterOfTemplate, template: IMongoEntityTemplate, path: string) {
        Object.entries(filterOfTemplate).forEach(([field, filterOfField]) => {
            if (!filterOfField) return;

            if (!template.propertiesOrder.includes(field)) throw new ValidationError(`field ${path}.${field} doesnt exist in template`);
            this.validateFilterOfField(filterOfField, template.properties.properties[field], `${path}.${field}`);
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

    public async getRelationshipTemplatesRelatedToEntityTemplates(entityTemplateIds: string[]) {
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

    public async validateSearchEntitiesOfTemplateBody(req: Request) {
        const { filter, showRelationships, sort }: ISearchEntitiesOfTemplateBody = req.body;
        const { templateId } = req.params;

        const entityTemplate = await this.getEntityTemplateByIdOrThrowValidationError(templateId);
        const entityTemplateForValidation = addDefaultFieldsToTemplate(entityTemplate);

        const relationshipTemplatesMap = await this.getRelationshipTemplatesRelatedToEntityTemplates([templateId]);

        if (filter) this.validateFilter(filter, entityTemplateForValidation, 'filter');

        this.validateShowRelationships(showRelationships, templateId, relationshipTemplatesMap, 'showRelationships');

        sort.forEach(({ field }, sortIndex) => {
            const fieldTemplate = entityTemplateForValidation.properties.properties[field];
            if (!fieldTemplate) {
                throw new ValidationError(`sort.${sortIndex}.field "${field}" must exist in template of search`);
            }
        });

        addPropertyToRequest(req, 'entityTemplate', entityTemplate);
    }

    public async validateSearchBatchBody(req: Request) {
        const searchBody: ISearchBatchBody = req.body;
        const templateIds = Object.keys(searchBody.templates);
        const entityTemplates = await this.entityTemplateManagerService.searchEntityTemplates({ ids: templateIds });
        if (entityTemplates.length < templateIds.length) {
            throw new ValidationError(`some of the templates in search doesnt exist. found only [${entityTemplates.map(({ _id }) => _id)}]`);
        }
        const entityTemplatesMap = new Map(entityTemplates.map((entityTemplate) => [entityTemplate._id, entityTemplate]));
        const entityTemplatesForValidationMap = new Map(
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
}
