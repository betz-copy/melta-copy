import { v4 as uuid } from 'uuid';
import axios from '../../axios';
import { EntityTemplateFormInputProperties, EntityTemplateWizardValues } from '../../common/wizards/entityTemplate';
import { environment } from '../../globals';
import { IEntitySingleProperty, IEntityTemplate, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getFileName } from '../../utils/getFileName';

const { entityTemplates } = environment.api;
export const basePropertyTypes = ['string', 'number', 'boolean'];
export const stringFormats = ['date', 'date-time', 'email', 'fileId'];
export const arrayTypes = ['multipleFiles', 'enumArray'];

const entityTemplateObjectToEntityTemplateForm = (entityTemplate: IMongoEntityTemplatePopulated | null): EntityTemplateWizardValues | undefined => {
    if (!entityTemplate) return undefined;
    const { iconFileId, properties, propertiesOrder, propertiesPreview, enumPropertiesColors, uniqueConstraints, ...restOfEntityTemplate } =
        entityTemplate;

    const propertiesArray: EntityTemplateFormInputProperties[] = [];
    const attachmentProperties: EntityTemplateFormInputProperties[] = [];

    propertiesOrder.forEach((key) => {
        const value = properties.properties[key];

        let type = value.format || value.type;
        if (value.serialStarter !== undefined) type = 'serialNumber';
        else if (value.enum) type = 'enum';
        else if (value.pattern) type = 'pattern';
        else if (value.items?.enum) type = 'enumArray';
        else if (value.items?.format === 'fileId') type = 'multipleFiles';

        const property: EntityTemplateFormInputProperties = {
            id: uuid(),
            name: key,
            title: value.title,
            required: properties.required.includes(key),
            preview: propertiesPreview.includes(key),
            hide: properties.hide.includes(key),
            unique: type !== 'serialNumber' && uniqueConstraints.filter((constraints) => constraints.properties.includes(key)).length > 0, // serials cant be marked unique
            calculateTime: value.calculateTime ?? undefined,
            type,
            options: value.enum || value.items?.enum || [],
            optionColors: enumPropertiesColors?.[key] ? enumPropertiesColors[key] : {},
            pattern: value.pattern || '',
            patternCustomErrorMessage: value.patternCustomErrorMessage || '',
            dateNotification: value.dateNotification,
            serialStarter: value.serialStarter,
        };

        if (value.format === 'fileId' || value.items?.format === 'fileId') {
            attachmentProperties.push(property);
        } else {
            propertiesArray.push(property);
        }
    });

    if (iconFileId) {
        const file: Partial<File> = { name: iconFileId };
        return {
            ...restOfEntityTemplate,
            icon: { file, name: getFileName(iconFileId) },
            properties: propertiesArray,
            attachmentProperties,
            uniqueConstraints,
        };
    }

    return { ...restOfEntityTemplate, properties: propertiesArray, attachmentProperties, uniqueConstraints };
};

export const formToJSONSchema = (values: EntityTemplateWizardValues): IEntityTemplate => {
    // change to support file types
    const { properties, attachmentProperties, propertiesTypeOrder, ...restOfProperties } = values;
    const serialsUniqueConstraints: string[][] = [];
    const propertiesOrder: string[] = [];
    const attachmentPropertiesOrder: string[] = [];
    const propertiesPreview: string[] = [];
    const uniqueConstraint: string[] = []; // UI supports only single unique constraint
    const schema: IEntityTemplate['properties'] = {
        type: 'object',
        properties: {},
        required: [],
        hide: [],
    };

    let enumPropertiesColors: IEntityTemplate['enumPropertiesColors'];

    properties.forEach(
        ({
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
            calculateTime,
            serialStarter,
            hide,
            unique,
        }) => {
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
                uniqueItems: type === 'enumArray' ? true : undefined,
                pattern: type === 'pattern' ? pattern : undefined,
                patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
                dateNotification: dateNotification as string | undefined,
                calculateTime: calculateTime ?? undefined,
                serialStarter: type === 'serialNumber' ? serialStarter : undefined,
                serialCurrent: type === 'serialNumber' ? serialStarter : undefined,
            };

            propertiesOrder.push(name);

            if (required) schema.required.push(name);
            if (hide) schema.hide.push(name);
            if (unique) uniqueConstraint.push(name);
            if (preview) propertiesPreview.push(name);
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

    attachmentProperties.forEach(({ name, title, required, type }) => {
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
        attachmentPropertiesOrder.push(name);

        if (required) schema.required.push(name);
    });

    // const uniqueConstraints = uniqueConstraint.length > 0 ? [uniqueConstraint, ...serialsUniqueConstraints] : serialsUniqueConstraints;
    const uniqueConstraints = uniqueConstraint.length > 0 ? [{ groupName: 'uniqueGroup', properties: uniqueConstraint }] : [];

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
        uniqueConstraints,
    };
};

const createEntityTemplateRequest = async (newEntityTemplate: EntityTemplateWizardValues) => {
    const formData = new FormData();

    const entityTemplate = formToJSONSchema(newEntityTemplate);

    if (newEntityTemplate.icon) {
        formData.append('file', newEntityTemplate.icon.file as File);
    }
    if (entityTemplate.enumPropertiesColors) {
        formData.append('enumPropertiesColors', JSON.stringify(entityTemplate.enumPropertiesColors));
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
            ? formToJSONSchema(updatedEntityTemplate as EntityTemplateWizardValues)
            : updatedEntityTemplate;

    if ('attachmentProperties' in updatedEntityTemplate && updatedEntityTemplate.icon) {
        if (updatedEntityTemplate.icon.file instanceof File) {
            formData.append('file', updatedEntityTemplate.icon.file);
        } else {
            formData.append('iconFileId', updatedEntityTemplate.icon.file.name!);
        }
    }
    if (entityTemplate.enumPropertiesColors) {
        formData.append('enumPropertiesColors', JSON.stringify(entityTemplate.enumPropertiesColors));
    }

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));
    formData.append('propertiesOrder', JSON.stringify(entityTemplate.propertiesOrder));
    formData.append('propertiesTypeOrder', JSON.stringify(entityTemplate.propertiesTypeOrder));
    formData.append('propertiesPreview', JSON.stringify(entityTemplate.propertiesPreview));
    formData.append('uniqueConstraints', JSON.stringify(entityTemplate.uniqueConstraints));

    const { data } = await axios.put<IMongoEntityTemplatePopulated>(`${entityTemplates}/${entityTemplateId}`, formData);
    return data;
};

const deleteEntityTemplateRequest = async (entityTemplateId: string) => {
    const { data } = await axios.delete(`${entityTemplates}/${entityTemplateId}`);
    return data;
};

export {
    createEntityTemplateRequest,
    updateEntityTemplateRequest,
    entityTemplateObjectToEntityTemplateForm,
    deleteEntityTemplateRequest,
    updateEntityTemplateStatusRequest,
};
