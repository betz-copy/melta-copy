/* eslint-disable no-param-reassign */
import { mapValues } from 'lodash';
import axios from '../axios';
import { EntityWizardValues } from '../common/dialogs/entity';
import { IUpdateMultipleEntitiesResponse } from '../common/EntitiesPage/MultiSelectStatusBar';
import urlToFile from '../common/fileConversions';
import { CoordinateSystem } from '../common/inputs/JSONSchemaFormik/RjsfLocationWidget';
import { environment } from '../globals';
import { IAxisField } from '../interfaces/charts';
import { IMongoChildTemplatePopulated } from '../interfaces/childTemplates';
import {
    ICountSearchResult,
    IDeleteEntityBody,
    IEntity,
    IEntityExpanded,
    IEntityWithIgnoredRules,
    IExportEntitiesBody,
    IGraphFilterBodyBatch,
    IMultipleSelect,
    ISearchBatchBody,
    ISearchEntitiesByLocationBody,
    ISearchEntitiesByTemplatesBody,
    ISearchEntitiesOfTemplateBody,
    ISearchFilter,
    ISearchResult,
} from '../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IEditReadExcel, ITablesResults } from '../interfaces/excel';
import { IBrokenRule, IRuleBreach } from '../interfaces/ruleBreaches/ruleBreach';
import { filterModelToFilterOfGraph } from '../pages/Graph/GraphFilterToBackend';
import { locationConverterToString } from '../utils/map/convert';
import { isChildTemplate } from '../utils/templates';

const { entities, relationships } = environment.api;
const { uuidFormat } = environment;

export const exportEntitiesRequest = async (body: IExportEntitiesBody) => {
    const { data } = await axios.post(`${entities}/export`, body, { responseType: 'blob' });
    return data;
};

export const loadEntitiesRequest = async (
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    files?: Record<string, File>,
    insertBrokenEntities?: IEntityWithIgnoredRules[],
): Promise<ITablesResults> => {
    const formData = new FormData();
    if (files)
        Object.entries(files).forEach(([key, value]) => {
            formData.append(key, value as Blob);
        });
    formData.append('templateId', isChildTemplate(template) ? template.parentTemplate._id : template._id);

    if (isChildTemplate(template)) {
        formData.append('childTemplateId', template._id);
    }

    if (insertBrokenEntities) {
        const formattedInsertBrokenEntities = insertBrokenEntities.map((entity) => ({
            templateId: entity.templateId,
            properties: mapValues(entity.properties, (property, key) => {
                switch (template.properties.properties[key]?.format) {
                    case 'relationshipReference':
                        return property?.properties._id;
                    case 'location': {
                        if (!property) return undefined;
                        const location = JSON.parse(property);

                        if (location.coordinateSystem === CoordinateSystem.UTM)
                            return JSON.stringify({
                                location: locationConverterToString(location.location),
                                coordinateSystem: location.coordinateSystem,
                            });
                        return JSON.stringify(location);
                    }
                    case 'signature':
                        return undefined;
                    default:
                        return property;
                }
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

export const editManyEntitiesByExcelRequest = async (
    template: IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated,
    entitiesToUpdate: IEntityWithIgnoredRules[],
): Promise<ITablesResults> => {
    const formData = new FormData();
    const isUUID = (str: string) => uuidFormat.test(str);

    formData.append('templateId', isChildTemplate(template) ? template.parentTemplate?._id : template._id);

    if (isChildTemplate(template)) {
        formData.append('childTemplateId', template._id);
    }

    const entitiesArray = entitiesToUpdate.map((entity) => ({
        templateId: entity.templateId,
        properties: mapValues(entity.properties, (property, key) => {
            switch (template.properties.properties[key]?.format) {
                case 'relationshipReference':
                    return property?.properties._id;
                case 'location': {
                    if (!property) return undefined;
                    return JSON.stringify(property);
                }
                case 'signature': {
                    if (!isUUID(property)) return undefined;
                    return property;
                }
                default:
                    return property;
            }
        }),
        ignoredRules: entity.ignoredRules,
    }));
    formData.append('entities', JSON.stringify(entitiesArray));

    const { data } = await axios.put(`${entities}/editManyEntitiesByExcel`, formData);

    return data;
};

export const getExpandedEntityByIdRequest = async (
    entityId: string,
    expandedParams: { [key: string]: number },
    options?: {
        disabled?: boolean;
        templateIds: string[];
    },
    filterRecord: IGraphFilterBodyBatch = {},
) => {
    const filters = filterModelToFilterOfGraph(filterRecord);
    const batch = (
        await axios.post<IEntityExpanded>(`${entities}/expanded/${entityId}`, {
            ...options,
            expandedParams,
            filters,
        })
    ).data;
    return batch;
};

export const getRelationshipInstancesCountByTemplateIdRequest = async (templateId: string) => {
    const { data } = await axios.get<number>(`${relationships}/count`, { params: { templateId } });
    return data;
};

export const createEntityRequest = async (entity: EntityWizardValues, ignoredRules?: IRuleBreach['brokenRules']) => {
    const formData = new FormData();

    formData.append(
        'properties',
        JSON.stringify(
            mapValues(entity.properties, (property, key) => {
                switch (entity.template.properties.properties[key]?.format) {
                    case 'relationshipReference':
                        return property?.properties._id;
                    case 'location': {
                        if (!property) return undefined;
                        const location = JSON.parse(property);

                        if (location.coordinateSystem === CoordinateSystem.UTM)
                            return JSON.stringify({
                                location: locationConverterToString(location.location),
                                coordinateSystem: location.coordinateSystem,
                            });
                        return JSON.stringify(location);
                    }
                    case 'signature':
                        return undefined;
                    default:
                        return property;
                }
            }),
        ),
    );

    formData.append('templateId', isChildTemplate(entity.template) ? entity.template.parentTemplate._id : entity.template._id);

    if (isChildTemplate(entity.template)) {
        formData.append('childTemplateId', entity.template._id);
    }

    if (ignoredRules) {
        formData.append('ignoredRules', JSON.stringify(ignoredRules));
    }

    const { data } = await axios.post<IEntity>(entities, formData);
    return data;
};

export const updateEntityStatusRequest = async (entityId: string, disabled: boolean, ignoredRules?: string) => {
    const { data } = await axios.patch<IEntity>(`${entities}/${entityId}/status`, { disabled, ignoredRules });
    return data;
};

const getBodyForUpdateRequest = async (
    newEntityData: EntityWizardValues,
    ignoredRules?: IRuleBreach['brokenRules'] | Record<string, IBrokenRule[]>,
) => {
    const isUUID = (str: string) => uuidFormat.test(str);
    const { template, attachmentsProperties } = newEntityData;
    const formData = new FormData();

    const filesToUpload: any = [];
    const unchangedFiles: any = []; /// //send single file as array to the back

    const properties = Object.entries(newEntityData.properties);
    const templateProperties = template.properties.properties;
    const fileUploadPromises: Promise<[string, File]>[] = [];

    Object.entries(attachmentsProperties).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value) && value) {
            value.forEach((file, index) => {
                if (file instanceof File && templateProperties[key].items) {
                    filesToUpload.push([`${key}.${index}`, file]);
                } else if (file instanceof File) {
                    filesToUpload.push([`${key}`, file]);
                } else {
                    unchangedFiles.push([`${key}`, file]);
                }
            });
        } else if (value) {
            if (value instanceof File) {
                filesToUpload.push([`${key}`, value]);
            } else {
                unchangedFiles.push([`${key}`, value]);
            }
        }
    });

    for (const [key, value] of properties) {
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
            properties[key] = value.name;
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
            // eslint-disable-next-line consistent-return
            mapValues(newEntityData.properties, (property, key) => {
                switch (template.properties.properties[key]?.format) {
                    case 'relationshipReference':
                        return property?.properties._id;
                    case 'location': {
                        if (!property) return undefined;
                        const location = typeof property === 'string' && property.includes('location') ? JSON.parse(property) : property;

                        if (location.coordinateSystem === CoordinateSystem.UTM)
                            return JSON.stringify({
                                location: locationConverterToString(location.location),
                                coordinateSystem: location.coordinateSystem,
                            });
                        return JSON.stringify(location);
                    }
                    case 'signature': {
                        if (!isUUID(property)) return undefined;
                        break;
                    }
                    default:
                        return property;
                }
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

    if (isChildTemplate(newEntityData.template)) {
        formData.append('childTemplateId', newEntityData.template._id);
    }

    const { data } = await axios.put<IUpdateMultipleEntitiesResponse>(`${entities}/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data;
};

export const duplicateEntityRequest = async (entityId: string, newEntityData: EntityWizardValues, ignoredRules?: IRuleBreach['brokenRules']) => {
    const formData = new FormData();
    const filesToUpload: any = [];
    const unchangedFiles: any = [];

    const { template, properties, attachmentsProperties } = newEntityData;

    Object.entries(attachmentsProperties).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value) && value) {
            value.forEach((file, index) => {
                if (file instanceof File && template.properties.properties[key].items) {
                    filesToUpload.push([`${key}.${index}`, file]);
                } else if (file instanceof File) {
                    filesToUpload.push([`${key}`, file]);
                } else {
                    unchangedFiles.push([`${key}`, file]);
                }
            });
        } else if (value) {
            if (value instanceof File) {
                filesToUpload.push([`${key}`, value]);
            } else {
                unchangedFiles.push([`${key}`, value]);
            }
        }
    });

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
            mapValues(properties, (property, key) => {
                switch (template.properties.properties[key]?.format) {
                    case 'relationshipReference':
                        return property?.properties._id;
                    case 'location': {
                        if (!property) return undefined;
                        const location = typeof property === 'string' && property.includes('location') ? JSON.parse(property) : property;

                        if (location.coordinateSystem === CoordinateSystem.UTM)
                            return JSON.stringify({
                                location: locationConverterToString(location.location),
                                coordinateSystem: location.coordinateSystem,
                            });
                        return JSON.stringify(location);
                    }
                    case 'signature':
                        return undefined;
                    default:
                        return property;
                }
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

export const searchEntitiesOfTemplateRequest = async (templateId: string, searchBody: ISearchEntitiesOfTemplateBody) => {
    const { data } = await axios.post<ISearchResult>(`${entities}/search/template/${templateId}`, searchBody);
    return data;
};

export const getCountByTemplateIdsRequest = async (templateIds: string[], textSearch: string = '', shouldSemanticSearch: boolean = false) => {
    const { data } = await axios.post<ICountSearchResult[]>(`${entities}/count`, { templateIds, textSearch, shouldSemanticSearch });
    return data;
};

export const searchEntitiesByTemplatesRequest = async (searchBodyByTemplates: ISearchEntitiesByTemplatesBody) => {
    const { data } = await axios.post<any>(`${entities}/search/templates`, searchBodyByTemplates);

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

export const getChartOfTemplate = async (xAxis: IAxisField, yAxis: IAxisField | undefined, templateId: string, filter?: ISearchFilter) => {
    const { data } = await axios.post<{ x: any; y: number }[][]>(`${entities}/chart/${templateId}`, [{ xAxis, yAxis, filter }]);

    return data;
};
