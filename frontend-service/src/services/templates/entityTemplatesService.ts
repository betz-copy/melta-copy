import { QueryClient } from 'react-query';
import { v4 as uuid } from 'uuid';
import axios from '../../axios';
import { EntityTemplateFormInputProperties, EntityTemplateWizardValues } from '../../common/wizards/entityTemplate';
import { CommonFormInputProperties, FieldGroupData, GroupProperty, PropertyItem } from '../../common/wizards/entityTemplate/commonInterfaces';
import {
    FilterModelToFilterRecord,
    filterTemplateToSearchFilter,
} from '../../common/wizards/entityTemplate/RelationshipReference/TemplateFilterToBackend';
import { environment } from '../../globals';
import { IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import {
    IEntitySingleProperty,
    IEntityTemplate,
    IEntityTemplateMap,
    IMongoEntityTemplatePopulated,
    ISearchEntityTemplateQuery,
    PropertyFormat,
    PropertyType,
} from '../../interfaces/entityTemplates';
import { getFileName } from '../../utils/getFileName';

const { entityTemplates } = environment.api;

export const PropertyWizardType = {
    ...PropertyType,
    ...PropertyFormat,
    users: 'users',
    serialNumber: 'serialNumber',
    enum: 'enum',
    pattern: 'pattern',
    multipleFiles: 'multipleFiles',
    enumArray: 'enumArray',
};

export const basePropertyTypes = [PropertyType.string, PropertyType.number, PropertyType.boolean];
export const stringFormats = Object.values(PropertyFormat);
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

export const entityTemplateObjectToEntityTemplateForm = (
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
        let type: any = value.format || value.type;

        if (value.serialStarter !== undefined) type = PropertyWizardType.serialNumber;
        else if (value.enum) type = PropertyWizardType.enum;
        else if (value.pattern) type = PropertyWizardType.pattern;
        else if (value.items?.enum) type = PropertyWizardType.enumArray;
        else if (value.items?.format === PropertyFormat.fileId) type = PropertyWizardType.multipleFiles;
        else if (value.items?.format === PropertyFormat.user) type = PropertyWizardType.users;
        else if (value.format) {
            switch (value.format) {
                case PropertyFormat.unitField:
                    type = PropertyFormat.unitField;
                    break;

                case PropertyFormat['text-area']:
                    type = PropertyFormat['text-area'];
                    break;

                case PropertyFormat.location:
                    type = PropertyFormat.location;
                    break;

                case PropertyFormat.comment:
                    type = PropertyFormat.comment;
                    break;

                default:
                    type = value.format; // fallback for any other format
            }
        }

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
            isProfileImage: value.isProfileImage || undefined,
            comment: value.comment,
            color: value.color,
        };

        if (value.format === PropertyFormat.fileId || value.items?.format === PropertyFormat.fileId) {
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

    const documentTemplates = documentTemplatesIds?.map((documentTemplateId) => ({ name: documentTemplateId }) as File);

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

        groupMap.get(fieldGroup.name)?.fields.push(name);
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

export const getPropertyType = (type: string): IEntitySingleProperty['type'] => {
    switch (type) {
        case PropertyType.string:
        case PropertyType.number:
        case PropertyType.boolean:
            return type;
        case 'serialNumber':
            return PropertyType.number;
        case 'enumArray':
        case 'users':
            return PropertyType.array;
        default:
            return PropertyType.string;
    }
};

const buildBasePropertySchema = (property: EntityTemplateFormInputProperties, queryClient: QueryClient): IEntitySingleProperty => {
    const {
        title,
        type,
        readOnly,
        archive,
        identifier,
        hideFromDetailsPage,
        isProfileImage,
        color,
        comment,
        pattern,
        patternCustomErrorMessage,
        dateNotification,
        calculateTime,
        isDailyAlert,
        isDatePastAlert,
        serialStarter,
        relationshipReference,
        expandedUserField,
        options,
    } = property;

    const propertyType = getPropertyType(type);

    return {
        title,
        type: propertyType,
        format: stringFormats.includes(type as any) ? (type as PropertyFormat) : undefined,
        enum: type === 'enum' ? options : undefined,
        items:
            type === 'enumArray'
                ? { type: PropertyType.string, enum: options }
                : type === 'users'
                  ? { type: PropertyType.string, format: PropertyFormat.user }
                  : undefined,
        minItems: type === 'enumArray' || type === 'users' ? 1 : undefined,
        readOnly,
        archive,
        identifier,
        hideFromDetailsPage,
        isProfileImage,
        color: comment && !color ? '#4752B6' : color,
        uniqueItems: ['enumArray', 'users'].includes(type) ? true : undefined,
        pattern: type === 'pattern' ? pattern : undefined,
        patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
        dateNotification: dateNotification as number | undefined,
        calculateTime: calculateTime ?? undefined,
        isDailyAlert: isDailyAlert ?? (dateNotification !== undefined ? true : undefined),
        isDatePastAlert: isDatePastAlert ?? (dateNotification !== undefined ? true : undefined),
        ...(type === 'serialNumber' ? { serialStarter, serialCurrent: serialStarter } : {}),
        relationshipReference: relationshipReference
            ? {
                  ...relationshipReference,
                  filters: relationshipReference.filters
                      ? filterTemplateToSearchFilter(relationshipReference.filters, relationshipReference.relatedTemplateId, queryClient)
                      : undefined,
              }
            : undefined,
        comment,
        expandedUserField,
    };
};

const shouldSkipProperty = ({ type, comment, deleted }: EntityTemplateFormInputProperties) => deleted || (type === 'comment' && !comment);

const applyEditModeIndicator = (
    schema: IEntityTemplate['properties']['properties'],
    extractData: EntityTemplateFormInputProperties[],
    name: string,
    id: string,
    isEditMode: boolean,
) => {
    if (!isEditMode) return;

    schema[name] = {
        ...schema[name],
        isNewPropNameEqualDeletedPropName: extractData.some((property) => property.id !== id && property.name === name),
    };
};

const collectEnumColors = (
    property: EntityTemplateFormInputProperties,
    enumPropertiesColors: IEntityTemplate['enumPropertiesColors'] | undefined,
) => {
    if (!['enum', 'enumArray'].includes(property.type)) return enumPropertiesColors;

    Object.entries(property.optionColors).forEach(([option, enumColor]) => {
        if (!enumColor) return;

        if (!enumPropertiesColors) enumPropertiesColors = {};
        if (!enumPropertiesColors[property.name]) enumPropertiesColors[property.name] = {};

        enumPropertiesColors[property.name][option] = enumColor;
    });

    return enumPropertiesColors;
};

const processStandardProperty = (
    property: EntityTemplateFormInputProperties,
    extractData: EntityTemplateFormInputProperties[],
    schema: IEntityTemplate['properties'],
    state: {
        propertiesOrder: string[];
        propertiesPreview: string[];
        mapSearchProperties: string[];
        serialsUniqueConstraints: string[];
        enumPropertiesColors: IEntityTemplate['enumPropertiesColors'] | undefined;
    },
    isEditMode: boolean,
    queryClient: QueryClient,
) => {
    if (shouldSkipProperty(property)) return;

    schema.properties[property.name] = buildBasePropertySchema(property, queryClient);

    applyEditModeIndicator(schema.properties, extractData, property.name, property.id, isEditMode);

    state.propertiesOrder.push(property.name);

    if (property.required) schema.required.push(property.name);
    if (property.hide) schema.hide.push(property.name);
    if (property.preview) state.propertiesPreview.push(property.name);
    if (property.mapSearch) state.mapSearchProperties.push(property.name);
    if (property.type === 'serialNumber') state.serialsUniqueConstraints.push(property.name);

    state.enumPropertiesColors = collectEnumColors(property, state.enumPropertiesColors);
};

const processAttachmentProperty = (
    { deleted, type, title, name, id, required }: EntityTemplateFormInputProperties,
    extractData: EntityTemplateFormInputProperties[],
    schema: IEntityTemplate['properties'],
    attachmentPropertiesOrder: string[],
    isEditMode: boolean,
) => {
    if (deleted) return;

    schema.properties[name] = {
        title,
        type: type === 'multipleFiles' ? PropertyType.array : PropertyType.string,
        ...(type === 'multipleFiles'
            ? {
                  items: { type: PropertyType.string, format: PropertyFormat.fileId },
                  minItems: 1,
              }
            : { format: PropertyFormat.fileId }),
    };

    applyEditModeIndicator(schema.properties, extractData, name, id, isEditMode);

    attachmentPropertiesOrder.push(name);
    if (required) schema.required.push(name);
};

export const formToJSONSchema = (values: EntityTemplateWizardValues, isEditMode: boolean, queryClient: QueryClient): IEntityTemplate => {
    const {
        properties,
        attachmentProperties,
        archiveProperties,
        propertiesTypeOrder,
        documentTemplatesIds: _documentTemplatesIds,
        fieldGroups: _fieldGroups,
        ...restOfProperties
    } = values;

    const serialsUniqueConstraints: string[] = [];
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

    const extractProps = extractProperties<EntityTemplateFormInputProperties>(properties).properties;
    const extractArchiveProps = extractProperties<EntityTemplateFormInputProperties>(archiveProperties).properties;
    const extractAttachmentProps = extractProperties<EntityTemplateFormInputProperties>(attachmentProperties).properties;

    const updatedFieldGroups = updateFieldGroupsOrder(extractProps, propertiesOrder);

    const state = {
        propertiesOrder,
        propertiesPreview,
        mapSearchProperties,
        serialsUniqueConstraints,
        enumPropertiesColors,
    };

    extractProps.forEach((property) => processStandardProperty(property, extractProps, schema, state, isEditMode, queryClient));
    extractArchiveProps.forEach((property) => processStandardProperty(property, extractProps, schema, state, isEditMode, queryClient));

    extractAttachmentProps.forEach((property) =>
        processAttachmentProperty(property, extractAttachmentProps, schema, attachmentPropertiesOrder, isEditMode),
    );

    const serialUniqueConstraints = serialsUniqueConstraints.map((serial) => ({
        groupName: '',
        properties: [serial],
    }));

    enumPropertiesColors = state.enumPropertiesColors;

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
        uniqueConstraints: [...(restOfProperties.uniqueConstraints ?? []), ...serialUniqueConstraints],
        mapSearchProperties,
        fieldGroups: updatedFieldGroups,
    };
};

export const searchEntityTemplates = async (searchQuery: ISearchEntityTemplateQuery) => {
    const { data } = await axios.post<IEntityTemplateMap>(`${entityTemplates}/search`, searchQuery);
    return data;
};

const isStringOrNamedObject = (item: File | string | { name: string }): item is string | { name: string } =>
    typeof item === 'string' || ('name' in item && !(item instanceof File));

const appendEntityTemplateFormData = (
    entityTemplate: IEntityTemplate,
    formData: FormData,
    original: EntityTemplateWizardValues | undefined = undefined,
) => {
    if (original?.icon) {
        if (original.icon.file instanceof File) formData.append('file', original.icon.file);
        else if (original.icon.file?.name) formData.append('iconFileId', original.icon.file.name);
    }

    original?.documentTemplatesIds?.filter((item): item is File => item instanceof File).forEach((file) => formData.append('files', file));

    const docTemplateIds = original?.documentTemplatesIds?.filter(isStringOrNamedObject).map((item) => (typeof item === 'string' ? item : item.name));

    if (docTemplateIds?.length) formData.append('documentTemplatesIds', JSON.stringify(docTemplateIds));
    if (entityTemplate.enumPropertiesColors) formData.append('enumPropertiesColors', JSON.stringify(entityTemplate.enumPropertiesColors));
    if (entityTemplate.mapSearchProperties) formData.append('mapSearchProperties', JSON.stringify(entityTemplate.mapSearchProperties));

    if (entityTemplate.propertiesTypeOrder.includes('archiveProperties'))
        entityTemplate.propertiesTypeOrder = entityTemplate.propertiesTypeOrder.filter((str) => str !== 'archiveProperties');

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));
    formData.append('propertiesOrder', JSON.stringify(entityTemplate.propertiesOrder));
    formData.append('propertiesTypeOrder', JSON.stringify(entityTemplate.propertiesTypeOrder));
    formData.append('propertiesPreview', JSON.stringify(entityTemplate.propertiesPreview));
    formData.append('uniqueConstraints', JSON.stringify(entityTemplate.uniqueConstraints));
    formData.append('fieldGroups', JSON.stringify(entityTemplate.fieldGroups));
};

export const createEntityTemplateRequest = async (newEntityTemplate: EntityTemplateWizardValues, queryClient: QueryClient) => {
    const formData = new FormData();
    const entityTemplate = formToJSONSchema(newEntityTemplate, false, queryClient);
    appendEntityTemplateFormData(entityTemplate, formData, newEntityTemplate);

    const { data } = await axios.post<IMongoEntityTemplatePopulated>(entityTemplates, formData);
    return data;
};

export const updateEntityTemplateRequest = async (
    entityTemplateId: string,
    updatedEntityTemplate: IEntityTemplate | EntityTemplateWizardValues,
    queryClient: QueryClient,
) => {
    const formData = new FormData();
    const entityTemplate: IEntityTemplate =
        'attachmentProperties' in updatedEntityTemplate
            ? formToJSONSchema(updatedEntityTemplate as EntityTemplateWizardValues, true, queryClient)
            : updatedEntityTemplate;

    const originalWizardValues = 'attachmentProperties' in updatedEntityTemplate ? (updatedEntityTemplate as EntityTemplateWizardValues) : undefined;
    appendEntityTemplateFormData(entityTemplate, formData, originalWizardValues);

    const { data } = await axios.put<{ template: IMongoEntityTemplatePopulated; childTemplates: IMongoChildTemplatePopulated[] }>(
        `${entityTemplates}/${entityTemplateId}`,
        formData,
    );
    return data;
};

export const updateEntityTemplateStatusRequest = async (entityTemplateId: string, disabledStatus: boolean) => {
    const { data } = await axios.patch<{ entityTemplate: IMongoEntityTemplatePopulated; childTemplates: IMongoChildTemplatePopulated[] }>(
        `${entityTemplates}/${entityTemplateId}/status`,
        {
            disabled: disabledStatus,
        },
    );
    return data;
};

export const deleteEntityTemplateRequest = async (entityTemplateId: string) => {
    const { data } = await axios.delete(`${entityTemplates}/${entityTemplateId}`);
    return data;
};

export const updateEnumFieldRequest = async (id: string, fieldValue: string, values: CommonFormInputProperties, field: string) => {
    const { name, type, options } = values;
    const partialInput = { name, type, options };
    const { data } = await axios.put<IMongoEntityTemplatePopulated>(`${entityTemplates}/update-enum-field/${id}`, {
        fieldValue,
        partialInput,
        field,
    });
    return data;
};

export const deleteEnumFieldRequest = async (id: string, fieldValue: string, field: CommonFormInputProperties) => {
    const { name, type, options } = field;
    const partialInput = { name, type, options };
    const { data } = await axios.patch<IMongoEntityTemplatePopulated>(`${entityTemplates}/delete-enum-field/${id}`, { fieldValue, partialInput });
    return data;
};

export const updateActionToEntity = async (templateId: string, actions: string, isChildTemplate?: boolean) => {
    const { data } = await axios.patch<IMongoEntityTemplatePopulated>(`${entityTemplates}/${templateId}/actions`, { actions, isChildTemplate });
    return data;
};
