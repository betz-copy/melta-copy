/* eslint-disable no-nested-ternary */
import i18next from 'i18next';
import { QueryClient } from 'react-query';
import { v4 as uuid } from 'uuid';
import axios from '../../axios';
import { commentColors } from '../../common/inputs/JSONSchemaFormik/RjsfCommentWidget';
import { EntityTemplateFormInputProperties, EntityTemplateWizardValues } from '../../common/wizards/entityTemplate';
import {
    FilterModelToFilterRecord,
    filterTemplateToSearchFilter,
} from '../../common/wizards/entityTemplate/RelationshipReference/TemplateFilterToBackend';
import { CommonFormInputProperties, FieldGroupData, GroupProperty, PropertyItem } from '../../common/wizards/entityTemplate/commonInterfaces';
import { environment } from '../../globals';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import {
    IEntitySingleProperty,
    IEntityTemplate,
    IEntityTemplateMap,
    IMongoEntityTemplatePopulated,
    ISearchEntityTemplateQuery,
} from '../../interfaces/entityTemplates';
import { getFileName } from '../../utils/getFileName';
import { BackendConfigState } from '../backendConfigService';

const { entityTemplates } = environment.api;

export const basePropertyTypes = ['string', 'number', 'boolean'];
export const stringFormats = [
    'date',
    'date-time',
    'email',
    'fileId',
    'text-area',
    'relationshipReference',
    'location',
    'user',
    'signature',
    'comment',
    'kartoffelUserField',
    'unitField',
];
export const arrayTypes = ['multipleFiles', 'enumArray', 'users'];

export const parseFilters = (filters: any) => (typeof filters === 'string' ? JSON.parse(filters) : filters);
type ExtractedProps<T> = {
    properties: T[];
    propertiesPath: Record<string, string>;
};

type AttachmentOrArchiveProperties = {
    type: 'field';
    data: EntityTemplateFormInputProperties;
};

const entityTemplateObjectToEntityTemplateForm = (
    entityTemplate: IMongoEntityTemplatePopulated | null,
    queryClient: QueryClient,
): EntityTemplateWizardValues | undefined => {
    if (!entityTemplate) return undefined;
    const {
        iconFileId,
        properties,
        propertiesOrder,
        propertiesPreview,
        enumPropertiesColors,
        uniqueConstraints,
        documentTemplatesIds,
        propertiesTypeOrder,
        mapSearchProperties,
        fieldGroups,
        ...restOfEntityTemplate
    } = entityTemplate;

    const attachmentProperties: AttachmentOrArchiveProperties[] = [];
    const archiveProperties: AttachmentOrArchiveProperties[] = [];
    const propertiesArray: PropertyItem[] = [];
    const usedFields = new Set();
    const fieldToGroup = {};
    fieldGroups?.forEach((group) => {
        const id = uuid();
        group.fields.forEach((fieldName) => {
            fieldToGroup[fieldName] = { ...group, id };
        });
    });

    const propertyData = (key: string, fieldGroup?: FieldGroupData) => {
        const value = properties.properties[key];
        let type = value.format || value.type;
        if (value.serialStarter !== undefined) type = 'serialNumber';
        else if (value.format === 'unitField') type = 'unitField';
        else if (value.enum) type = 'enum';
        else if (value.pattern) type = 'pattern';
        else if (value.format && value.format === 'text-area') type = 'text-area';
        else if (value.format && value.format === 'location') type = 'location';
        else if (value.items?.enum) type = 'enumArray';
        else if (value.items?.format === 'fileId') type = 'multipleFiles';
        else if (value.items?.format === 'user') type = 'users';
        else if (value.items?.format === 'text-area') type = 'text-area';
        else if (value.format && value.format === 'comment') type = 'comment';

        const property: EntityTemplateFormInputProperties = {
            id: uuid(),
            name: key,
            title: value.title,
            required: properties.required.includes(key),
            preview: propertiesPreview.includes(key),
            hide: properties.hide.includes(key),
            readOnly: value.readOnly || undefined,
            expandedUserField: value.expandedUserField,
            uniqueCheckbox: uniqueConstraints.some((constraint) => constraint.properties.includes(key) && constraint.groupName !== ''),
            groupName: uniqueConstraints.find((constraint) => constraint.properties.includes(key) && constraint.groupName !== '')?.groupName,
            calculateTime: value.calculateTime ?? undefined,
            type,
            options: value.enum || value.items?.enum || [],
            optionColors: enumPropertiesColors?.[key] ? enumPropertiesColors[key] : {},
            pattern: value.pattern || '',
            patternCustomErrorMessage: value.patternCustomErrorMessage || '',
            dateNotification: value.dateNotification,
            isDailyAlert: value.isDailyAlert ?? undefined,
            isDatePastAlert: value.isDatePastAlert ?? undefined,
            serialStarter: value.serialStarter,
            relationshipReference: value.relationshipReference
                ? {
                      relationshipTemplateId: value.relationshipReference.relationshipTemplateId,
                      relationshipTemplateDirection: value.relationshipReference.relationshipTemplateDirection,
                      relatedTemplateId: value.relationshipReference.relatedTemplateId,
                      relatedTemplateField: value.relationshipReference.relatedTemplateField,
                      filters: value.relationshipReference.filters
                          ? FilterModelToFilterRecord(
                                parseFilters(value.relationshipReference.filters),
                                value.relationshipReference.relatedTemplateId,
                                queryClient,
                            )
                          : undefined,
                  }
                : undefined,
            archive: value.archive || undefined,
            identifier: value.identifier || undefined,
            mapSearch: mapSearchProperties?.includes(key) || undefined,
            fieldGroup: !value.archive ? fieldGroup : undefined,
            hideFromDetailsPage: value.hideFromDetailsPage || undefined,
            comment: value.comment,
            color: value.color,
        };

        if (value.format === 'fileId' || value.items?.format === 'fileId') {
            attachmentProperties.push({
                type: 'field',
                data: property,
            });
            return undefined;
        }
        if (value.archive) {
            archiveProperties.push({ type: 'field', data: property });
            return undefined;
        }
        return property;
    };

    propertiesOrder.forEach((key) => {
        if (!usedFields.has(key)) {
            const group = fieldToGroup[key];
            if (group) {
                let existingGroup = propertiesArray.find((item) => item.type === 'group' && item.name === group.name) as GroupProperty;
                const { name, displayName, id } = group;

                if (!existingGroup) {
                    existingGroup = {
                        type: 'group',
                        name,
                        displayName,
                        id,
                        fields: [],
                    };
                    propertiesArray.push(existingGroup);
                }
                for (const groupedField of group.fields) {
                    if (!usedFields.has(groupedField)) {
                        const propertyDetails = propertyData(groupedField, { name, displayName, id });
                        if (propertyDetails) {
                            existingGroup.fields.push(propertyDetails);
                            usedFields.add(groupedField);
                        }
                    }
                }
            } else {
                const propertyDetails = propertyData(key);
                if (propertyDetails)
                    propertiesArray.push({
                        type: 'field',
                        data: propertyDetails,
                    });
                usedFields.add(key);
            }
        }
    });

    if (archiveProperties.length !== 0 && !propertiesTypeOrder.includes('archiveProperties')) propertiesTypeOrder.push('archiveProperties');

    const documentTemplates = documentTemplatesIds?.map((documentTemplateId) => ({ name: documentTemplateId } as File));

    if (iconFileId) {
        const file: Partial<File> = { name: iconFileId };
        return {
            ...restOfEntityTemplate,
            icon: { file, name: getFileName(iconFileId) },
            properties: propertiesArray,
            attachmentProperties,
            archiveProperties,
            uniqueConstraints,
            documentTemplatesIds: documentTemplates,
            propertiesTypeOrder,
            fieldGroups,
        };
    }

    return {
        ...restOfEntityTemplate,
        properties: propertiesArray,
        attachmentProperties,
        archiveProperties,
        uniqueConstraints,
        documentTemplatesIds: documentTemplates,
        propertiesTypeOrder,
        fieldGroups,
    };
};

const updateFieldGroupsOrder = (updatedProperties: EntityTemplateFormInputProperties[], propertiesOrder: string[]) => {
    const groupMap = new Map<string, { name: string; displayName: string; fields: string[] }>();

    updatedProperties.forEach((property) => {
        const { fieldGroup, name, archive, deleted } = property;

        if (archive || deleted || !fieldGroup?.name) return;

        if (!groupMap.has(fieldGroup.name)) {
            groupMap.set(fieldGroup.name, {
                name: fieldGroup.name,
                displayName: fieldGroup.displayName,
                fields: [],
            });
        }

        groupMap.get(fieldGroup.name)!.fields.push(name);
    });

    const fieldGroups = Array.from(groupMap.values());

    fieldGroups.forEach((group) => {
        group.fields.sort((a, b) => propertiesOrder.indexOf(a) - propertiesOrder.indexOf(b));
    });

    return fieldGroups;
};

export const extractProperties = <T>(
    items: Array<{ type: 'field'; data: CommonFormInputProperties } | { type: 'group'; fields: CommonFormInputProperties[] }>,
    propertyPath?: string,
): ExtractedProps<T> => {
    const properties: T[] = [];
    const propertiesPath: Record<string, string> = {};

    items.forEach((item, index) => {
        if (item.type === 'field') {
            properties.push(item.data as T);
            if (propertyPath) propertiesPath[item.data.id] = `${propertyPath}[${index}].data`;
        } else if (item.type === 'group') {
            item.fields.forEach((field, idx) => {
                properties.push(field as T);
                if (propertyPath) propertiesPath[field.id] = `${propertyPath}[${index}].fields[${idx}]`;
            });
        }
    });

    return {
        properties,
        propertiesPath,
    };
};

export const extractGroups = (
    properties: PropertyItem[],
): {
    groupsProperties: (GroupProperty & { index: number })[];
    groupsPath: Record<string, string>;
} => {
    const groupsProperties: (GroupProperty & { index: number })[] = properties
        .map((item, index) => ({ ...item, index }))
        .filter((item) => item.type === 'group') as (GroupProperty & { index: number })[];

    const groupsPath = Object.fromEntries(groupsProperties.map(({ id, index }) => [id, `properties[${index}]`]));

    return {
        groupsProperties,
        groupsPath,
    };
};

export const formToJSONSchema = (values: EntityTemplateWizardValues, isEditMode: boolean, queryClient: QueryClient): IEntityTemplate => {
    const config = queryClient.getQueryData<BackendConfigState>('getBackendConfig');

    const { properties, attachmentProperties, archiveProperties, propertiesTypeOrder, documentTemplatesIds, fieldGroups, ...restOfProperties } =
        values;
    const serialsUniqueConstraints: string[][] = [];
    const propertiesOrder: string[] = [];
    const attachmentPropertiesOrder: string[] = [];
    const propertiesPreview: string[] = [];
    const mapSearchProperties: string[] = [];
    const schema: IEntityTemplate['properties'] = {
        type: 'object',
        properties: {},
        required: [],
        hide: [],
    };

    let enumPropertiesColors: IEntityTemplate['enumPropertiesColors'];

    const { properties: extractPropertiesData } = extractProperties<EntityTemplateFormInputProperties>(properties);
    const { properties: extractArchiveProperties } = extractProperties<EntityTemplateFormInputProperties>(archiveProperties);
    const { properties: extractAttachmentPropertiesData } = extractProperties<EntityTemplateFormInputProperties>(attachmentProperties);

    const updatedFieldsGroups = updateFieldGroupsOrder(extractPropertiesData, propertiesOrder);

    extractPropertiesData.forEach(
        ({
            id,
            name,
            title,
            type,
            required,
            preview,
            options,
            optionColors,
            pattern,
            patternCustomErrorMessage,
            dateNotification,
            isDailyAlert,
            isDatePastAlert,
            calculateTime,
            serialStarter,
            hide,
            deleted,
            readOnly,
            relationshipReference,
            archive,
            identifier,
            mapSearch,
            hideFromDetailsPage,
            color,
            comment,
            expandedUserField,
        }) => {
            if (deleted) return;
            if (type === 'comment' && !comment) return;

            let propertyType: IEntitySingleProperty['type'];
            switch (type) {
                case 'string':
                case 'number':
                case 'boolean':
                    propertyType = type;
                    break;
                case 'serialNumber':
                    propertyType = 'number';
                    break;
                case 'enumArray':
                    propertyType = 'array';
                    break;
                case 'users':
                    propertyType = 'array';
                    break;
                default:
                    propertyType = 'string';
            }

            schema.properties[name] = {
                title,
                type: propertyType,
                format: (stringFormats.includes(type) ? type : undefined) as
                    | 'date'
                    | 'date-time'
                    | 'email'
                    | 'fileId'
                    | 'signature'
                    | 'text-area'
                    | 'relationshipReference'
                    | 'user'
                    | 'comment'
                    | 'kartoffelUserField'
                    | 'unitField'
                    | undefined,
                enum: type === 'enum' ? options : undefined,
                items: type === 'enumArray' ? { type: 'string', enum: options } : type === 'users' ? { type: 'string', format: 'user' } : undefined,
                minItems: type === 'enumArray' || type === 'users' ? 1 : undefined,
                readOnly,
                archive,
                identifier,
                hideFromDetailsPage,
                color: comment && !color ? commentColors[i18next.t('validation.colors.blue')] : color,
                uniqueItems: type === 'enumArray' || type === 'users' ? true : undefined,
                pattern: type === 'pattern' ? pattern : undefined,
                patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
                dateNotification: dateNotification as number | undefined,
                calculateTime: calculateTime ?? undefined,
                isDailyAlert: isDailyAlert ?? (dateNotification !== undefined ? true : undefined),
                isDatePastAlert: isDatePastAlert ?? (dateNotification !== undefined ? true : undefined),
                serialStarter: type === 'serialNumber' ? serialStarter : undefined,
                serialCurrent: type === 'serialNumber' ? serialStarter : undefined,
                relationshipReference: relationshipReference
                    ? {
                          relationshipTemplateId: relationshipReference!.relationshipTemplateId,
                          relationshipTemplateDirection: relationshipReference!.relationshipTemplateDirection,
                          relatedTemplateId: relationshipReference!.relatedTemplateId,
                          relatedTemplateField: relationshipReference!.relatedTemplateField,
                          filters: relationshipReference.filters
                              ? filterTemplateToSearchFilter(relationshipReference.filters, relationshipReference.relatedTemplateId, queryClient)
                              : undefined,
                      }
                    : undefined,
                comment,
                expandedUserField,
            };
            if (isEditMode) {
                schema.properties[name] = {
                    ...schema.properties[name],
                    isNewPropNameEqualDeletedPropName: extractPropertiesData.some((property) => property.id !== id && property.name === name),
                };
            }
            propertiesOrder.push(name);

            if (required) schema.required.push(name);
            if (hide) schema.hide.push(name);
            if (preview) propertiesPreview.push(name);
            if (mapSearch) mapSearchProperties.push(name);
            if (type === 'serialNumber') serialsUniqueConstraints.push([name]);
            if (type === 'enum' || type === 'enumArray') {
                Object.entries(optionColors).forEach(([option, enumColor]) => {
                    if (!enumColor) return;
                    if (!enumPropertiesColors) enumPropertiesColors = {};
                    if (!enumPropertiesColors[name]) enumPropertiesColors[name] = {};
                    enumPropertiesColors[name][option] = enumColor;
                });
            }
            if (type === 'unitField') {
                schema.properties[name].enum = [...(config?.units || [])];
            }
        },
    );

    extractArchiveProperties.forEach(
        ({
            id,
            name,
            title,
            type,
            required,
            preview,
            options,
            optionColors,
            pattern,
            patternCustomErrorMessage,
            dateNotification,
            isDailyAlert,
            isDatePastAlert,
            calculateTime,
            serialStarter,
            hide,
            deleted,
            readOnly,
            identifier,
            relationshipReference,
            archive,
            mapSearch,
            hideFromDetailsPage,
            color,
            comment,
            expandedUserField,
        }) => {
            if (deleted) return;
            if (type === 'comment' && !comment) return;

            let propertyType: IEntitySingleProperty['type'];
            switch (type) {
                case 'string':
                case 'number':
                case 'boolean':
                    propertyType = type;
                    break;
                case 'serialNumber':
                    propertyType = 'number';
                    break;
                case 'enumArray':
                    propertyType = 'array';
                    break;
                default:
                    propertyType = 'string';
            }

            schema.properties[name] = {
                title,
                type: propertyType,
                format: stringFormats.includes(type) ? type : undefined,
                enum: type === 'enum' ? options : undefined,
                items: type === 'enumArray' ? { type: 'string', enum: options } : undefined,
                minItems: type === 'enumArray' ? 1 : undefined,
                readOnly,
                archive,
                identifier,
                hideFromDetailsPage,
                color: comment && !color ? '#4752B6' : color,
                uniqueItems: type === 'enumArray' || type === 'users' ? true : undefined,
                pattern: type === 'pattern' ? pattern : undefined,
                patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
                dateNotification: dateNotification as number | undefined,
                calculateTime: calculateTime ?? undefined,
                isDailyAlert: isDailyAlert ?? (dateNotification !== undefined ? true : undefined),
                isDatePastAlert: isDatePastAlert ?? (dateNotification !== undefined ? true : undefined),
                serialStarter: type === 'serialNumber' ? serialStarter : undefined,
                serialCurrent: type === 'serialNumber' ? serialStarter : undefined,
                relationshipReference: relationshipReference
                    ? {
                          relationshipTemplateId: relationshipReference!.relationshipTemplateId,
                          relationshipTemplateDirection: relationshipReference!.relationshipTemplateDirection,
                          relatedTemplateId: relationshipReference!.relatedTemplateId,
                          relatedTemplateField: relationshipReference!.relatedTemplateField,
                          filters: relationshipReference.filters
                              ? filterTemplateToSearchFilter(relationshipReference.filters, relationshipReference.relatedTemplateId, queryClient)
                              : undefined,
                      }
                    : undefined,
                comment,
                expandedUserField,
            };

            if (isEditMode) {
                schema.properties[name] = {
                    ...schema.properties[name],
                    isNewPropNameEqualDeletedPropName: extractPropertiesData.some((property) => property.id !== id && property.name === name),
                };
            }

            propertiesOrder.push(name);

            if (required) schema.required.push(name);
            if (hide) schema.hide.push(name);
            if (preview) propertiesPreview.push(name);
            if (mapSearch) mapSearchProperties.push(name);
            if (type === 'serialNumber') serialsUniqueConstraints.push([name]);
            if (type === 'enum' || type === 'enumArray') {
                Object.entries(optionColors).forEach(([option, enumColor]) => {
                    if (!enumColor) return;
                    if (!enumPropertiesColors) enumPropertiesColors = {};
                    if (!enumPropertiesColors[name]) enumPropertiesColors[name] = {};
                    enumPropertiesColors[name][option] = enumColor;
                });
            }
        },
    );

    extractAttachmentPropertiesData.forEach(({ id, name, title, required, type, deleted }) => {
        if (deleted) return;

        if (type === 'multipleFiles') {
            schema.properties[name] = {
                title,
                type: 'array',
                items: {
                    type: 'string',
                    format: 'fileId',
                },
                minItems: 1,
            };
        } else {
            schema.properties[name] = {
                title,
                type: 'string',
                format: 'fileId',
            };
        }

        if (isEditMode) {
            schema.properties[name] = {
                ...schema.properties[name],
                isNewPropNameEqualDeletedPropName: extractAttachmentPropertiesData.some((property) => property.id !== id && property.name === name),
            };
        }

        attachmentPropertiesOrder.push(name);
        if (required) schema.required.push(name);
    });

    return {
        ...restOfProperties,
        properties: schema,
        category: values.category._id,
        propertiesOrder:
            propertiesTypeOrder[0] === 'properties'
                ? [...propertiesOrder, ...attachmentPropertiesOrder]
                : [...attachmentPropertiesOrder, ...propertiesOrder],
        propertiesTypeOrder,
        propertiesPreview,
        enumPropertiesColors,
        uniqueConstraints: restOfProperties.uniqueConstraints || [],
        mapSearchProperties,
        fieldGroups: updatedFieldsGroups,
    };
};

const searchEntityTemplates = async (searchQuery: ISearchEntityTemplateQuery) => {
    const { data } = await axios.post<IEntityTemplateMap>(`${entityTemplates}/search`, searchQuery);
    return data;
};

const createEntityTemplateRequest = async (newEntityTemplate: EntityTemplateWizardValues, queryClient: QueryClient) => {
    const formData = new FormData();

    const entityTemplate = formToJSONSchema(newEntityTemplate, false, queryClient);

    if (newEntityTemplate.icon) {
        if (newEntityTemplate.icon.file instanceof File) {
            formData.append('file', newEntityTemplate.icon.file);
        } else if (newEntityTemplate.icon.file?.name) {
            formData.append('iconFileId', newEntityTemplate.icon.file.name);
        }
    }

    newEntityTemplate.documentTemplatesIds?.filter((item): item is File => item instanceof File).forEach((file) => formData.append('files', file));

    const docTemplateIds = newEntityTemplate.documentTemplatesIds
        ?.filter((item): item is any | { name: string } => {
            return typeof item === 'string' || ('name' in item && !(item instanceof File));
        })
        .map((item) => (typeof item === 'string' ? item : item.name));

    if (docTemplateIds?.length) {
        formData.append('documentTemplatesIds', JSON.stringify(docTemplateIds));
    }

    if (entityTemplate.enumPropertiesColors) {
        formData.append('enumPropertiesColors', JSON.stringify(entityTemplate.enumPropertiesColors));
    }

    if (entityTemplate.propertiesTypeOrder.includes('archiveProperties')) {
        entityTemplate.propertiesTypeOrder = entityTemplate.propertiesTypeOrder.filter((str) => str !== 'archiveProperties');
    }

    if (entityTemplate.mapSearchProperties) {
        formData.append('mapSearchProperties', JSON.stringify(entityTemplate.mapSearchProperties));
    }

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('disabled', String(entityTemplate.disabled));
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));
    formData.append('propertiesOrder', JSON.stringify(entityTemplate.propertiesOrder));
    formData.append('propertiesTypeOrder', JSON.stringify(entityTemplate.propertiesTypeOrder));
    formData.append('propertiesPreview', JSON.stringify(entityTemplate.propertiesPreview));
    formData.append('uniqueConstraints', JSON.stringify(entityTemplate.uniqueConstraints));
    formData.append('fieldGroups', JSON.stringify(entityTemplate.fieldGroups));

    const { data } = await axios.post<IMongoEntityTemplatePopulated>(entityTemplates, formData);
    return data;
};

const updateEntityTemplateStatusRequest = async (entityTemplateId: string, disabledStatus: boolean) => {
    const { data } = await axios.patch<IMongoEntityTemplatePopulated>(`${entityTemplates}/${entityTemplateId}/status`, {
        disabled: disabledStatus,
    });
    return data;
};

const updateEntityTemplateRequest = async (
    entityTemplateId: string,
    updatedEntityTemplate: IEntityTemplate | EntityTemplateWizardValues,
    queryClient: QueryClient,
) => {
    const formData = new FormData();

    const entityTemplate: IEntityTemplate =
        'attachmentProperties' in updatedEntityTemplate
            ? formToJSONSchema(updatedEntityTemplate as EntityTemplateWizardValues, true, queryClient)
            : updatedEntityTemplate;

    if ('attachmentProperties' in updatedEntityTemplate && updatedEntityTemplate.icon) {
        if (updatedEntityTemplate.icon.file instanceof File) {
            formData.append('file', updatedEntityTemplate.icon.file);
        } else if (updatedEntityTemplate.icon.file?.name) {
            formData.append('iconFileId', updatedEntityTemplate.icon.file.name);
        }
    }

    ((updatedEntityTemplate.documentTemplatesIds as (File | string | { name: string })[]) ?? [])
        .filter((item): item is File => item instanceof File)
        .forEach((file) => formData.append('files', file));

    const docTemplateIds = ((updatedEntityTemplate.documentTemplatesIds as (File | string | { name: string })[]) ?? [])
        .filter((item): item is string | { name: string } => {
            return typeof item === 'string' || ('name' in item && !(item instanceof File));
        })
        .map((item) => (typeof item === 'string' ? item : item.name));

    if (docTemplateIds?.length) {
        formData.append('documentTemplatesIds', JSON.stringify(docTemplateIds));
    }

    if (entityTemplate.enumPropertiesColors) {
        formData.append('enumPropertiesColors', JSON.stringify(entityTemplate.enumPropertiesColors));
    }

    if (entityTemplate.propertiesTypeOrder.includes('archiveProperties')) {
        entityTemplate.propertiesTypeOrder = entityTemplate.propertiesTypeOrder.filter((str) => str !== 'archiveProperties');
    }

    if (entityTemplate.mapSearchProperties) {
        formData.append('mapSearchProperties', JSON.stringify(entityTemplate.mapSearchProperties));
    }

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));
    formData.append('propertiesOrder', JSON.stringify(entityTemplate.propertiesOrder));
    formData.append('propertiesTypeOrder', JSON.stringify(entityTemplate.propertiesTypeOrder));
    formData.append('propertiesPreview', JSON.stringify(entityTemplate.propertiesPreview));
    formData.append('uniqueConstraints', JSON.stringify(entityTemplate.uniqueConstraints));
    formData.append('fieldGroups', JSON.stringify(entityTemplate.fieldGroups));

    const { data } = await axios.put<{ template: IMongoEntityTemplatePopulated; childTemplates: IMongoChildTemplatePopulated[] }>(
        `${entityTemplates}/${entityTemplateId}`,
        formData,
    );
    return data;
};

const deleteEntityTemplateRequest = async (entityTemplateId: string) => {
    const { data } = await axios.delete(`${entityTemplates}/${entityTemplateId}`);
    return data;
};

const updateEnumFieldRequest = async (id: string, fieldValue: string, values: CommonFormInputProperties, field: string) => {
    const { name, type, options } = values;
    const partialInput = { name, type, options };
    const { data } = await axios.put<IMongoEntityTemplatePopulated>(`${entityTemplates}/update-enum-field/${id}`, {
        fieldValue,
        partialInput,
        field,
    });
    return data;
};

const deleteEnumFieldRequest = async (id: string, fieldValue: string, field: CommonFormInputProperties) => {
    const { name, type, options } = field;
    const partialInput = { name, type, options };
    const { data } = await axios.patch<IMongoEntityTemplatePopulated>(`${entityTemplates}/delete-enum-field/${id}`, { fieldValue, partialInput });
    return data;
};

const updateActionToEntity = async (templateId: string, actions: string, isChildTemplate?: boolean) => {
    const { data } = await axios.patch<IMongoEntityTemplatePopulated>(`${entityTemplates}/${templateId}/actions`, { actions, isChildTemplate });
    return data;
};

export {
    createEntityTemplateRequest,
    deleteEntityTemplateRequest,
    deleteEnumFieldRequest,
    entityTemplateObjectToEntityTemplateForm,
    searchEntityTemplates,
    updateActionToEntity,
    updateEntityTemplateRequest,
    updateEntityTemplateStatusRequest,
    updateEnumFieldRequest,
};
