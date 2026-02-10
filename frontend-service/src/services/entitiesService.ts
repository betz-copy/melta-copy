import { IAxisField } from '@packages/chart';
import { isChildTemplate } from '@packages/child-template';
import {
    ICountSearchResult,
    IDeleteEntityBody,
    IEntity,
    IEntityExpanded,
    IEntityWithDirectConnections,
    IExportEntitiesBody,
    IMultipleSelect,
    IPropertyValue,
    ISearchBatchBody,
    ISearchEntitiesByLocationBody,
    ISearchEntitiesByTemplatesBody,
    ISearchEntitiesOfTemplateBody,
    ISearchFilter,
    ISearchResult,
} from '@packages/entity';
import { CoordinateSystem } from '@packages/map';
import { IRelationShipSelectionTree } from '@packages/printing-template';
import { IBrokenRule, IRuleBreach } from '@packages/rule-breach';
import axios from '../axios';
import { EntityWizardValues } from '../common/dialogs/entity';
import { IUpdateMultipleEntitiesResponse } from '../common/EntitiesPage/MultiSelectStatusBar';
import { IExternalId } from '../common/EntitiesTableOfTemplate';
import urlToFile from '../common/fileConversions';
import { environment } from '../globals';
import { IEntityWithIgnoredRules } from '../interfaces/entity';
import { IEditReadExcel, ITablesResults } from '../interfaces/excel';
import { IGraphFilterBodyBatch } from '../interfaces/graphFilter';
import { ITemplate } from '../interfaces/template';
import { IEntityTreeNode } from '../pages/Entity/components/print/ComponentToPrint';
import { filterModelToFilterOfGraph } from '../pages/Graph/GraphFilterToBackend';
import { combineFilters } from '../utils/filters';
import { locationConverterToString } from '../utils/map/convert';
import { PropertyFormat } from '@packages/entity-template';

const { entities, relationships } = environment.api;
const { uuidFormat } = environment;

const OMIT_PROPERTY = Symbol('omit-property');

type TemplatePropertiesMap = Record<string, { format?: string; items?: { format?: string } } | undefined>;
type TransformPropertyHandler = (property: IPropertyValue, key: string) => IPropertyValue | typeof OMIT_PROPERTY | undefined;

const transformProperties = (
    properties: Record<string, IPropertyValue>,
    templateProperties: TemplatePropertiesMap,
    handlers: Partial<Record<string, TransformPropertyHandler>>,
) =>
    Object.entries(properties).reduce<Record<string, IPropertyValue>>((acc, [key, property]) => {
        const templateProperty = templateProperties[key];

        if (templateProperty?.format === PropertyFormat.kartoffelUserField) return acc;

        const handler = templateProperty?.format ? handlers[templateProperty.format] : undefined;
        let value: IPropertyValue | typeof OMIT_PROPERTY | undefined;

        if (handler) value = handler(property, key);
        else if (templateProperty?.items?.format === PropertyFormat.user) value = property ? property.map(({ _id }) => _id) : undefined;
        else value = property;

        if (value !== OMIT_PROPERTY) acc[key] = value;

        return acc;
    }, {});

const transformDate = (property: IPropertyValue) => (property ? new Date(property).toISOString().split('T')[0] : undefined);

const transformDateTime = (property: IPropertyValue) => (property ? new Date(property).toISOString() : undefined);

const transformUser = (property: IPropertyValue) => (property ? property._id : undefined);

const transformRelationshipRef = (property: IPropertyValue) => property?.properties._id;

const isUUID = (str: string) => uuidFormat.test(str);
const transformSignature = (property: IPropertyValue) => (isUUID(property as string) ? property : undefined);

const stringifyLocationWithUtm = (location: { coordinateSystem: CoordinateSystem; location: IPropertyValue }) => {
    if (location.coordinateSystem === CoordinateSystem.UTM) {
        return JSON.stringify({
            location: locationConverterToString(location.location),
            coordinateSystem: location.coordinateSystem,
        });
    }

    return JSON.stringify(location);
};

const parseLocationFromString = (property: IPropertyValue) => {
    if (!property) return undefined;
    const location = JSON.parse(property as string);

    return stringifyLocationWithUtm(location);
};

const parseLocationFromAny = (property: IPropertyValue) => {
    if (!property) return undefined;
    const location = typeof property === 'string' && property.includes('location') ? JSON.parse(property) : property;

    return stringifyLocationWithUtm(location);
};

const stringifyLocation = (property: IPropertyValue) => {
    if (!property) return undefined;
    return JSON.stringify(property);
};

const collectFilesWithUnchanged = (attachmentsProperties: Record<string, IPropertyValue>, templateProperties: TemplatePropertiesMap) => {
    const filesToUpload: IPropertyValue = [];
    const unchangedFiles: IPropertyValue = [];

    Object.entries(attachmentsProperties).forEach(([key, value]: [string, IPropertyValue]) => {
        if (Array.isArray(value)) {
            value.forEach((file, index) => {
                if (file instanceof File && templateProperties[key]?.items) filesToUpload.push([`${key}.${index}`, file]);
                else if (file instanceof File) filesToUpload.push([`${key}`, file]);
                else unchangedFiles.push([`${key}`, file]);
            });
        } else if (value) {
            if (value instanceof File) filesToUpload.push([`${key}`, value]);
            else unchangedFiles.push([`${key}`, value]);
        }
    });

    return { filesToUpload, unchangedFiles };
};

export const exportEntitiesRequest = async (body: IExportEntitiesBody) => {
    const { data } = await axios.post(`${entities}/export`, body, { responseType: 'blob' });
    return data;
};

export const loadEntitiesRequest = async (
    template: ITemplate,
    files?: Record<string, File>,
    insertBrokenEntities?: IEntityWithIgnoredRules[],
): Promise<ITablesResults> => {
    const formData = new FormData();
    if (files)
        Object.entries(files).forEach(([key, value]) => {
            formData.append(key, value as Blob);
        });

    formData.append('templateId', isChildTemplate(template) ? template.parentTemplate._id : template._id);

    if (isChildTemplate(template)) formData.append('childTemplateId', template._id);

    if (insertBrokenEntities) {
        const formattedInsertBrokenEntities = insertBrokenEntities.map((entity) => ({
            templateId: entity.templateId,
            properties: transformProperties(entity.properties, template.properties.properties, {
                location: parseLocationFromString,
                signature: () => undefined,
                user: transformUser,
            }),
            ignoredRules: entity.ignoredRules,
        }));

        formData.append('insertBrokenEntities', JSON.stringify(formattedInsertBrokenEntities));
    }

    const { data } = await axios.post(`${entities}/loadEntities`, formData);

    return data;
};

export const getChangedEntitiesFromExcelRequest = async (
    templateId: string,
    file: Record<string, File>,
    childTemplateId?: string,
): Promise<IEditReadExcel> => {
    const formData = new FormData();

    Object.entries(file).forEach(([key, value]) => {
        formData.append(key, value as Blob);
    });
    formData.append('templateId', templateId);

    if (childTemplateId) {
        formData.append('childTemplateId', childTemplateId);
    }

    const { data } = await axios.post(`${entities}/getChangedEntitiesFromExcel`, formData);

    return data;
};

export const editManyEntitiesByExcelRequest = async (template: ITemplate, entitiesToUpdate: IEntityWithIgnoredRules[]): Promise<ITablesResults> => {
    const formData = new FormData();

    formData.append('templateId', isChildTemplate(template) ? template.parentTemplate?._id : template._id);

    if (isChildTemplate(template)) {
        formData.append('childTemplateId', template._id);
    }

    const entitiesArray = entitiesToUpdate.map((entity) => ({
        templateId: entity.templateId,
        properties: transformProperties(entity.properties, template.properties.properties, {
            relationshipReference: transformRelationshipRef,
            location: stringifyLocation,
            signature: transformSignature,
            user: transformUser,
        }),
        ignoredRules: entity.ignoredRules,
    }));
    formData.append('entities', JSON.stringify(entitiesArray));

    const { data } = await axios.put(`${entities}/editManyEntitiesByExcel`, formData);

    return data;
};

export const getExpandedEntityByIdRequest = async (
    entityId: string,
    expandedParams: Record<string, { minLevel?: number; maxLevel: number }>,
    options?: {
        templateIds: string[];
        childTemplateId?: string;
    },
    filterRecord: IGraphFilterBodyBatch = {},
    childTemplateFilters?: ISearchFilter,
): Promise<IEntityExpanded> => {
    const filters = filterModelToFilterOfGraph(filterRecord);

    const { data } = await axios.post<IEntityExpanded>(`${entities}/expanded/${entityId}`, {
        ...options,
        expandedParams,
        filters: combineFilters(filters.filter, childTemplateFilters),
    });
    return data;
};

// Actual tree with entities for print
export const getEntitiesTreeForPrint = async (id: string, relationshipIds: string[], isShowDisabled: boolean) => {
    const { data } = await axios.post<IEntityTreeNode>(`${entities}/printEntities/${id}`, {
        relationshipIds,
        isShowDisabled,
    });
    return data;
};

// Only templateIds for select tree of what to print
export const getRelationshipSelectTreeForPrint = async (
    entityId: string,
    expandedParams: Record<string, { minLevel?: number; maxLevel: number }>,
    options?: {
        isShowDisabled?: boolean;
        relationshipIds?: string[];
        templateIds: string[];
        childTemplateId?: string;
    },
    filterRecord: IGraphFilterBodyBatch = {},
    childTemplateFilters?: ISearchFilter,
): Promise<IRelationShipSelectionTree[]> => {
    const filters = filterModelToFilterOfGraph(filterRecord);

    const { data } = await axios.post(`${entities}/templatesStructure/${entityId}`, {
        ...options,
        expandedParams,
        filters: combineFilters(filters.filter, childTemplateFilters),
    });
    return data;
};

export const getRelationshipInstancesCountByTemplateIdRequest = async (templateId: string) => {
    const { data } = await axios.get<number>(`${relationships}/count`, { params: { templateId } });
    return data;
};

export const createEntityRequest = async (entity: EntityWizardValues, ignoredRules?: IRuleBreach['brokenRules']) => {
    const formData = new FormData();

    const templateProperties = entity.template.properties.properties;
    const filesToUpload: IPropertyValue = [];
    const fileUploadPromises: Promise<[string, File]>[] = [];

    Object.entries(entity.attachmentsProperties).forEach(([key, value]: [string, IPropertyValue]) => {
        if (Array.isArray(value)) {
            value.forEach((file, index) => {
                if (file instanceof File && entity.template.properties.properties[key].items) filesToUpload.push([`${key}.${index}`, file]);
                else if (file instanceof File) filesToUpload.push([`${key}`, file]);
            });
        } else filesToUpload.push([`${key}`, value]);
    });

    Object.entries(entity.properties).forEach(([key, value]: [string, IPropertyValue]) => {
        if (templateProperties[key]?.format === 'signature' && value)
            fileUploadPromises.push(urlToFile(value, templateProperties[key]?.title).then((file) => [key, file]));
    });
    filesToUpload.push(...(await Promise.all(fileUploadPromises)));

    filesToUpload.forEach(([key, value]) => {
        formData.append(key, value as Blob);
    });

    formData.append(
        'properties',
        JSON.stringify(
            transformProperties(entity.properties, entity.template.properties.properties, {
                relationshipReference: transformRelationshipRef,
                location: parseLocationFromString,
                signature: () => undefined,
                date: transformDate,
                'date-time': transformDateTime,
                user: transformUser,
            }),
        ),
    );

    formData.append('templateId', isChildTemplate(entity.template) ? entity.template.parentTemplate._id : entity.template._id);

    if (isChildTemplate(entity.template)) formData.append('childTemplateId', entity.template._id);

    if (ignoredRules) formData.append('ignoredRules', JSON.stringify(ignoredRules));

    const { data } = await axios.post<IEntity>(entities, formData);
    return data;
};

export const updateEntityStatusRequest = async (entityId: string, disabled: boolean, ignoredRules?: string, childTemplateId?: string) => {
    const { data } = await axios.patch<IEntity>(`${entities}/${entityId}/status`, { disabled, ignoredRules, childTemplateId });
    return data;
};

const getBodyForUpdateRequest = async (
    newEntityData: EntityWizardValues,
    ignoredRules?: IRuleBreach['brokenRules'] | Record<string, IBrokenRule[]>,
) => {
    const isUUID = (str: string) => uuidFormat.test(str);
    const { template, attachmentsProperties } = newEntityData;
    const formData = new FormData();

    const templateProperties = template.properties.properties;
    const fileUploadPromises: Promise<[string, File]>[] = [];
    const { filesToUpload, unchangedFiles } = collectFilesWithUnchanged(attachmentsProperties, templateProperties);

    for (const [key, value] of Object.entries(newEntityData.properties)) {
        if (templateProperties[key]?.format === 'signature') {
            if (value && isUUID(value)) {
                unchangedFiles.push([key, { name: value }]);
            } else if (value) {
                fileUploadPromises.push(urlToFile(value, templateProperties[key]!.title).then((file) => [key, file]));
            }
        }
    }

    filesToUpload.push(...(await Promise.all(fileUploadPromises)));

    filesToUpload.forEach(([key, value]) => {
        formData.append(key, value);
    });
    unchangedFiles.forEach(([key, _value]) => {
        newEntityData.properties[key] = [];
    });
    unchangedFiles.forEach(([key, value]) => {
        if (!template.properties.properties[key].items) {
            newEntityData.properties[key] = value.name;
        } else {
            if (!newEntityData.properties[key]) {
                newEntityData.properties[key] = [];
            }
            if (value) {
                newEntityData.properties[key].push(value.name);
            }
        }
    });

    formData.append(
        'properties',
        JSON.stringify(
            transformProperties(newEntityData.properties, template.properties.properties, {
                relationshipReference: transformRelationshipRef,
                location: parseLocationFromAny,
                signature: transformSignature,
                date: transformDate,
                'date-time': transformDateTime,
                user: transformUser,
            }),
        ),
    );

    formData.append('templateId', isChildTemplate(template) ? template.parentTemplate._id : template._id);

    if (isChildTemplate(template)) formData.append('childTemplateId', template._id);

    if (ignoredRules) formData.append('ignoredRules', JSON.stringify(ignoredRules));

    return formData;
};

export const updateEntityRequestForMultiple = async (
    entityId: string,
    newEntityData: EntityWizardValues,
    ignoredRules?: IRuleBreach['brokenRules'],
) => {
    const formData = await getBodyForUpdateRequest(newEntityData, ignoredRules);

    const { data } = await axios.put<IEntity>(`${entities}/${entityId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data;
};

export const updateMultipleEntitiesRequest = async (
    entitiesToUpdate: IMultipleSelect<boolean>,
    newEntityData: EntityWizardValues,
    propertiesToRemove: string[],
    ignoredRules?: Record<string, IBrokenRule[]>,
) => {
    const formData = await getBodyForUpdateRequest(newEntityData, ignoredRules);
    formData.append('entitiesToUpdate', JSON.stringify(entitiesToUpdate));
    formData.append('propertiesToRemove', JSON.stringify(propertiesToRemove || []));

    const { data } = await axios.put<IUpdateMultipleEntitiesResponse>(`${entities}/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data;
};

export const duplicateEntityRequest = async (entityId: string, newEntityData: EntityWizardValues, ignoredRules?: IRuleBreach['brokenRules']) => {
    const formData = new FormData();
    const { template, properties, attachmentsProperties } = newEntityData;
    const { filesToUpload, unchangedFiles } = collectFilesWithUnchanged(attachmentsProperties, template.properties.properties);

    filesToUpload.forEach(([key, value]) => {
        formData.append(key, value as Blob);
    });
    unchangedFiles.forEach(([key, _value]) => {
        properties[key] = [];
    });
    unchangedFiles.forEach(([key, value]) => {
        if (!template.properties.properties[key].items) {
            properties[key] = value.name;
        } else {
            if (!properties[key]) {
                properties[key] = [];
            }
            if (value) {
                properties[key].push(value.name);
            }
        }
    });

    formData.append(
        'properties',
        JSON.stringify(
            transformProperties(properties, template.properties.properties, {
                relationshipReference: transformRelationshipRef,
                location: parseLocationFromAny,
                signature: transformSignature,
                date: transformDate,
                'date-time': transformDateTime,
                user: transformUser,
            }),
        ),
    );

    formData.append('templateId', isChildTemplate(template) ? template.parentTemplate._id : template._id);

    if (isChildTemplate(template)) {
        formData.append('childTemplateId', template._id);
    }

    if (ignoredRules) {
        formData.append('ignoredRules', JSON.stringify(ignoredRules));
    }

    const { data } = await axios.post<IEntity>(`${entities}/${entityId}/duplicate`, formData);
    return data;
};

export const deleteEntityRequest = async (deleteBody: IDeleteEntityBody) => {
    const { data } = await axios.post<void>(`${entities}/delete/bulk`, deleteBody);
    return data;
};

export const searchEntitiesOfTemplateRequest = async (
    templateId: string,
    searchBody: ISearchEntitiesOfTemplateBody & { childTemplateIds?: string[]; externalId?: IExternalId },
) => {
    const { data } = await axios.post<ISearchResult>(`${entities}/search/template/${templateId}`, searchBody);
    return data;
};

export const getCountByTemplateIdsRequest = async (
    templateIds: string[],
    childTemplateIds: string[] = [],
    textSearch = '',
    shouldSemanticSearch = false,
) => {
    const { data } = await axios.post<ICountSearchResult[]>(`${entities}/count`, { templateIds, childTemplateIds, textSearch, shouldSemanticSearch });
    return data;
};

export const searchEntitiesByTemplatesRequest = async (searchBodyByTemplates: ISearchEntitiesByTemplatesBody) => {
    const { data } = await axios.post<{
        [templateId: string]: {
            entities: IEntityWithDirectConnections[];
            count: number;
        };
    }>(`${entities}/search/templates`, searchBodyByTemplates);

    return data;
};

export const getEntityById = async (entityId: string) => {
    const { data } = await axios.get<IEntity>(`${entities}/${entityId}`);
    return data;
};

export const getEntitiesWithDirectConnections = async (searchBody: ISearchBatchBody) => {
    const { data } = await axios.post<ISearchResult>(`${entities}/search/batch`, searchBody);
    return data;
};

export const getEntitiesByLocation = async (searchBody: ISearchEntitiesByLocationBody) => {
    const { data } = await axios.post<{ node: IEntity; matchingFields: string[] }[]>(`${entities}/search/location`, searchBody);
    return data;
};

export const exportEntityToDocumentRequest = async (documentTemplateId: string, entity: IEntity) => {
    const { data } = await axios.post<Blob>(`${entities}/export/document`, { documentTemplateId, entity }, { responseType: 'blob' });
    return data;
};

export const getChartOfTemplate = async (
    xAxis: IAxisField,
    yAxis: IAxisField | undefined,
    templateId: string,
    filter?: ISearchFilter,
    childTemplateId?: string,
) => {
    const { data } = await axios.post<{ x: IPropertyValue; y: number }[][]>(`${entities}/chart/${templateId}`, {
        chartsData: [{ xAxis, yAxis, filter }],
        childTemplateId,
    });

    return data;
};
