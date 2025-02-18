/* eslint-disable no-nested-ternary */
import { v4 as uuid } from 'uuid';
import axios from '../../axios';
import { EntityTemplateFormInputProperties, EntityTemplateWizardValues } from '../../common/wizards/entityTemplate';
import { environment } from '../../globals';
import {
    IEntitySingleProperty,
    IEntityTemplate,
    IEntityTemplateMap,
    IMongoEntityTemplatePopulated,
    ISearchEntityTemplateQuery,
} from '../../interfaces/entityTemplates';
import { getFileName } from '../../utils/getFileName';
import { CommonFormInputProperties } from '../../common/wizards/entityTemplate/commonInterfaces';

const { entityTemplates } = environment.api;
export const basePropertyTypes = ['string', 'number', 'boolean'];
export const stringFormats = ['date', 'date-time', 'email', 'fileId', 'text-area', 'relationshipReference', 'location', 'user'];
export const arrayTypes = ['multipleFiles', 'enumArray', 'users'];

const entityTemplateObjectToEntityTemplateForm = (entityTemplate: IMongoEntityTemplatePopulated | null): EntityTemplateWizardValues | undefined => {
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
        ...restOfEntityTemplate
    } = entityTemplate;    

    const propertiesArray: EntityTemplateFormInputProperties[] = [];
    const attachmentProperties: EntityTemplateFormInputProperties[] = [];
    const archiveProperties: EntityTemplateFormInputProperties[] = [];

    propertiesOrder.forEach((key) => {
        const value = properties.properties[key];

        let type = value.format || value.type;
        if (value.serialStarter !== undefined) type = 'serialNumber';
        // else if (value.items?.format === 'user') type = 'users'; // TODO
        else if (value.enum) type = 'enum';
        else if (value.pattern) type = 'pattern';
        else if (value.format && value.format === 'text-area') type = 'text-area';
        else if (value.format && value.format === 'location') type = 'location';
        else if (value.items?.enum) type = 'enumArray';
        else if (value.items?.format === 'fileId') type = 'multipleFiles';
        else if (value.items?.format === 'user') type = 'users';
        else if (value.items?.format === 'text-area') type = 'text-area';

        const property: EntityTemplateFormInputProperties = {
            id: uuid(),
            name: key,
            title: value.title,
            required: properties.required.includes(key),
            preview: propertiesPreview.includes(key),
            hide: properties.hide.includes(key),
            readOnly: value.readOnly || undefined,
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
            relationshipReference: value.relationshipReference || undefined,
            archive: value.archive || undefined,
            identifier: value.identifier || undefined,
            mapSearch: mapSearchProperties?.includes(key) || undefined,
        };

        if (value.format === 'fileId' || value.items?.format === 'fileId') {
            attachmentProperties.push(property);
        } else if (value.archive) {
            archiveProperties.push(property);
        } else {
            propertiesArray.push(property);
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
    };
};

export const formToJSONSchema = (values: EntityTemplateWizardValues, isEditMode: boolean): IEntityTemplate => {
    // change to support file types
    const { properties, attachmentProperties, archiveProperties, propertiesTypeOrder, documentTemplatesIds, ...restOfProperties } = values;
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

    properties.forEach(
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
        }) => {
            if (deleted) return;

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
                    | 'text-area'
                    | 'relationshipReference'
                    | 'user'
                    | undefined,
                enum: type === 'enum' ? options : undefined,
                items:
                    type === 'enumArray' ? { type: 'string', enum: options } : type === 'users' ? { type: 'string', format: 'user' } : undefined,
                minItems: type === 'enumArray' || type === 'users' ? 1 : undefined,
                readOnly,
                archive,
                identifier,
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
                      }
                    : undefined,
            };
            if (isEditMode) {
                schema.properties[name] = {
                    ...schema.properties[name],
                    isNewPropNameEqualDeletedPropName: properties.some((property) => property.id !== id && property.name === name),
                };
            }
            
            propertiesOrder.push(name);

            if (required) schema.required.push(name);
            if (hide) schema.hide.push(name);
            if (preview) propertiesPreview.push(name);
            if (mapSearch) mapSearchProperties.push(name);
            if (type === 'serialNumber') serialsUniqueConstraints.push([name]);
            if (type === 'enum' || type === 'enumArray') {
                Object.entries(optionColors).forEach(([option, color]) => {
                    if (!color) return;
                    if (!enumPropertiesColors) enumPropertiesColors = {};
                    if (!enumPropertiesColors[name]) enumPropertiesColors[name] = {};
                    enumPropertiesColors[name][option] = color;
                    });
                }
        },
    );

    archiveProperties.forEach(
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
        }) => {
            if (deleted) return; 

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
                      }
                    : undefined,
            };

            if (isEditMode) {
                schema.properties[name] = {
                    ...schema.properties[name],
                    isNewPropNameEqualDeletedPropName: properties.some((property) => property.id !== id && property.name === name),
                };
            }

            propertiesOrder.push(name);
            
            if (required) schema.required.push(name);
            if (hide) schema.hide.push(name);
            if (preview) propertiesPreview.push(name);
            if (mapSearch) mapSearchProperties.push(name);
            if (type === 'serialNumber') serialsUniqueConstraints.push([name]);
            if (type === 'enum' || type === 'enumArray') {
                Object.entries(optionColors).forEach(([option, color]) => {
                    if (!color) return;
                    if (!enumPropertiesColors) enumPropertiesColors = {};
                    if (!enumPropertiesColors[name]) enumPropertiesColors[name] = {};
                    enumPropertiesColors[name][option] = color;
                });
            }
        },
    );

    attachmentProperties.forEach(({ id, name, title, required, type, deleted }) => {
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
                isNewPropNameEqualDeletedPropName: attachmentProperties.some((property) => property.id !== id && property.name === name),
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
    };
};

const searchEntityTemplates = async (searchQuery: ISearchEntityTemplateQuery) => {
    const { data } = await axios.post<IEntityTemplateMap>(`${entityTemplates}/search`, searchQuery);
    return data;
};

const createEntityTemplateRequest = async (newEntityTemplate: EntityTemplateWizardValues) => {
    const formData = new FormData();

    const entityTemplate = formToJSONSchema(newEntityTemplate, false);

    if (newEntityTemplate.icon) {
        formData.append('file', newEntityTemplate.icon.file as File);
    }

    newEntityTemplate.documentTemplatesIds?.forEach((documentTemplateId) => {
        formData.append('files', documentTemplateId);
    });

    if (entityTemplate.enumPropertiesColors) {
        formData.append('enumPropertiesColors', JSON.stringify(entityTemplate.enumPropertiesColors));
    }

    if (entityTemplate.propertiesTypeOrder.includes('archiveProperties')) {
        entityTemplate.propertiesTypeOrder = entityTemplate.propertiesTypeOrder.filter((str) => str !== 'archiveProperties');
    }

    if (entityTemplate.mapSearchProperties)
        formData.append('mapSearchProperties', JSON.stringify(entityTemplate.mapSearchProperties));

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('disabled', String(entityTemplate.disabled));
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));
    formData.append('propertiesOrder', JSON.stringify(entityTemplate.propertiesOrder));
    formData.append('propertiesTypeOrder', JSON.stringify(entityTemplate.propertiesTypeOrder));
    formData.append('propertiesPreview', JSON.stringify(entityTemplate.propertiesPreview));
    formData.append('uniqueConstraints', JSON.stringify(entityTemplate.uniqueConstraints));

    const { data } = await axios.post<IMongoEntityTemplatePopulated>(entityTemplates, formData);
    return data;
};

const updateEntityTemplateStatusRequest = async (entityTemplateId: string, disabledStatus: boolean) => {
    const { data } = await axios.patch<IMongoEntityTemplatePopulated>(`${entityTemplates}/${entityTemplateId}/status`, {
        disabled: disabledStatus,
    });
    return data;
};

const updateEntityTemplateRequest = async (entityTemplateId: string, updatedEntityTemplate: IEntityTemplate | EntityTemplateWizardValues) => {
    const formData = new FormData();
    const entityTemplate: IEntityTemplate =
        'attachmentProperties' in updatedEntityTemplate // its type is - EntityTemplateWizardValues
            ? formToJSONSchema(updatedEntityTemplate as EntityTemplateWizardValues, true)
            : updatedEntityTemplate;

    if ('attachmentProperties' in updatedEntityTemplate && updatedEntityTemplate.icon) {
        if (updatedEntityTemplate.icon.file instanceof File) {
            formData.append('file', updatedEntityTemplate.icon.file);
        } else {
            formData.append('iconFileId', updatedEntityTemplate.icon.file.name!);
        }
    }

    if (updatedEntityTemplate.documentTemplatesIds) {
        updatedEntityTemplate.documentTemplatesIds.forEach((documentTemplateId) => {
            if (documentTemplateId instanceof File) formData.append('files', documentTemplateId);
        });
    }

    if (entityTemplate.enumPropertiesColors) {
        formData.append('enumPropertiesColors', JSON.stringify(entityTemplate.enumPropertiesColors));
    }

    if (entityTemplate.propertiesTypeOrder.includes('archiveProperties')) {
        entityTemplate.propertiesTypeOrder = entityTemplate.propertiesTypeOrder.filter((str) => str !== 'archiveProperties');
    }

    if (entityTemplate.mapSearchProperties)
        formData.append('mapSearchProperties', JSON.stringify(entityTemplate.mapSearchProperties));

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));
    formData.append('propertiesOrder', JSON.stringify(entityTemplate.propertiesOrder));
    formData.append('propertiesTypeOrder', JSON.stringify(entityTemplate.propertiesTypeOrder));
    formData.append('propertiesPreview', JSON.stringify(entityTemplate.propertiesPreview));
    formData.append('uniqueConstraints', JSON.stringify(entityTemplate.uniqueConstraints));
    if (updatedEntityTemplate.documentTemplatesIds)
        formData.append(
            'documentTemplatesIds',
            JSON.stringify(
                [...updatedEntityTemplate.documentTemplatesIds]
                    .filter((fileTemplate) => !(fileTemplate instanceof File))
                    .map((fileTemplate: string | { name: string }) => (typeof fileTemplate === 'string' ? fileTemplate : fileTemplate.name)),
            ),
        );
    const { data } = await axios.put<IMongoEntityTemplatePopulated>(`${entityTemplates}/${entityTemplateId}`, formData);
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

const updateActionToEntity = async (entityTemplateId: string, actions: string) => {
    const { data } = await axios.patch<IMongoEntityTemplatePopulated>(`${entityTemplates}/${entityTemplateId}/actions`, { actions });
    return data;
};

export {
    createEntityTemplateRequest,
    searchEntityTemplates,
    updateEntityTemplateRequest,
    entityTemplateObjectToEntityTemplateForm,
    deleteEntityTemplateRequest,
    updateEntityTemplateStatusRequest,
    updateEnumFieldRequest,
    deleteEnumFieldRequest,
    updateActionToEntity,
};
