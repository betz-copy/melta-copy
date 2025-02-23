/* eslint-disable no-param-reassign */
import { mapValues } from 'lodash';
import axios from '../axios';
import { environment } from '../globals';
import {
    IEntity,
    IEntityExpanded,
    ISearchBatchBody,
    ISearchResult,
    ISearchEntitiesOfTemplateBody,
    IExportEntitiesBody,
    IGraphFilterBodyBatch,
    ISearchEntitiesByTemplatesBody,
    ISearchEntitiesByLocationBody,
    IDeleteEntityBody,
    ICountSearchResult,
    ISearchFilter,
    IEntityWithIgnoredRules,
} from '../interfaces/entities';
import { EntityWizardValues } from '../common/dialogs/entity';
import { IRuleBreach } from '../interfaces/ruleBreaches/ruleBreach';
import { filterModelToFilterOfGraph } from '../pages/Graph/GraphFilterToBackend';
import { ITablesResults } from '../common/wizards/loadEntities';
import { IAxisField } from '../interfaces/charts';

const { entities, relationships } = environment.api;

export const exportEntitiesRequest = async (body: IExportEntitiesBody) => {
    const { data } = await axios.post(`${entities}/export`, body, { responseType: 'blob' });
    return data;
};

export const loadEntitiesRequest = async (
    templateId: string,
    files?: Record<string, File>,
    insertBrokenEntities?: IEntityWithIgnoredRules[],
): Promise<ITablesResults> => {
    const formData = new FormData();
    if (files)
        Object.entries(files).forEach(([key, value]) => {
            formData.append(key, value as Blob);
        });
    formData.append('templateId', templateId);

    if (insertBrokenEntities) {
        const formattedInsertBrokenEntities = insertBrokenEntities.map((entity) => ({
            templateId: entity.templateId,
            properties: mapValues(entity.properties, (property) => property),
            ignoredRules: entity.ignoredRules,
        }));

        formData.append('insertBrokenEntities', JSON.stringify(formattedInsertBrokenEntities));
    }

    const { data } = await axios.post(`${entities}/loadEntities`, formData);

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

    const filesToUpload: any = [];
    Object.entries(entity.attachmentsProperties).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value)) {
            value.forEach((file, index) => {
                if (file instanceof File && entity.template.properties.properties[key].items) {
                    filesToUpload.push([`${key}.${index}`, file]);
                } else if (file instanceof File) {
                    filesToUpload.push([`${key}`, file]);
                }
            });
        } else {
            filesToUpload.push([`${key}`, value]);
        }
    });
    filesToUpload.forEach(([key, value]) => {
        formData.append(key, value as Blob);
    });
    formData.append(
        'properties',
        JSON.stringify(
            mapValues(entity.properties, (property, key) =>
                entity.template.properties.properties[key]?.format === 'relationshipReference' ? property?.properties._id : property,
            ),
        ),
    );
    formData.append('templateId', entity.template._id);

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

export const updateEntityRequestForMultiple = async (
    entityId: string,
    newEntityData: EntityWizardValues,
    ignoredRules?: IRuleBreach['brokenRules'],
) => {
    const formData = new FormData();

    const filesToUpload: any = [];
    const unchangedFiles: any = []; /// //send single file as array to the back

    Object.entries(newEntityData.attachmentsProperties).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value) && value) {
            value.forEach((file, index) => {
                if (file instanceof File && newEntityData.template.properties.properties[key].items) {
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
        formData.append(key, value);
    });
    unchangedFiles.forEach(([key, _value]) => {
        newEntityData.properties[key] = [];
    });
    unchangedFiles.forEach(([key, value]) => {
        if (!newEntityData.template.properties.properties[key].items) {
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
            mapValues(newEntityData.properties, (property, key) =>
                newEntityData.template.properties.properties[key]?.format === 'relationshipReference' ? property?.properties._id : property,
            ),
        ),
    );

    formData.append('templateId', newEntityData.template._id);

    if (ignoredRules) {
        formData.append('ignoredRules', JSON.stringify(ignoredRules));
    }

    const { data } = await axios.put<IEntity>(`${entities}/${entityId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data;
};

export const duplicateEntityRequest = async (entityId: string, newEntityData: EntityWizardValues, ignoredRules?: IRuleBreach['brokenRules']) => {
    const formData = new FormData();
    const filesToUpload: any = [];
    const unchangedFiles: any = [];

    Object.entries(newEntityData.attachmentsProperties).forEach(([key, value]: [string, any]) => {
        if (Array.isArray(value) && value) {
            value.forEach((file, index) => {
                if (file instanceof File && newEntityData.template.properties.properties[key].items) {
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
        newEntityData.properties[key] = [];
    });
    unchangedFiles.forEach(([key, value]) => {
        if (!newEntityData.template.properties.properties[key].items) {
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
            mapValues(newEntityData.properties, (property, key) =>
                newEntityData.template.properties.properties[key].format === 'relationshipReference' ? property?.properties._id : property,
            ),
        ),
    );
    formData.append('templateId', newEntityData.template._id);

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

export const exportEntityToDocumentRequest = async (documentTemplateId: string, entityProperties: EntityWizardValues['properties']) => {
    const { data } = await axios.post<Blob>(`${entities}/export/document`, { documentTemplateId, entityProperties }, { responseType: 'blob' });
    return data;
};

export const getChartOfTemplate = async (
    xAxis: IAxisField,
    yAxis: IAxisField | undefined,
    templateId: string,
    filter?: ISearchFilter<Record<string, any>>,
) => {
    const { data } = await axios.post<{ x: any; y: any }[][]>(`${entities}/chart/${templateId}`, [{ xAxis, yAxis, filter }]);

    return data;
};
