import { v4 as uuid } from 'uuid';
import axios from '../../axios';
import { EntityTemplateFormInputProperties, EntityTemplateWizardValues } from '../../common/wizards/entityTemplate';
import { environment } from '../../globals';
import { IEntitySingleProperty, IEntityTemplate, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getFileName } from '../../utils/getFileName';

const { entityTemplates } = environment.api;
export const basePropertyTypes = ['string', 'number', 'boolean'];
export const stringFormats = ['date', 'date-time', 'email'];

const entityTemplateObjectToEntityTemplateForm = (entityTemplate: IMongoEntityTemplatePopulated | null): EntityTemplateWizardValues | undefined => {
    if (!entityTemplate) return undefined;
    const { iconFileId, properties, propertiesOrder, propertiesPreview, uniqueConstraints, ...restOfEntityTemplate } = entityTemplate;

    const propertiesArray: EntityTemplateFormInputProperties[] = [];
    const attachmentProperties: EntityTemplateFormInputProperties[] = [];

    propertiesOrder.forEach((key) => {
        const value = properties.properties[key];

        let type = value.format || value.type;
        if (value.enum) {
            type = 'enum';
        }
        if (value.pattern) {
            type = 'pattern';
        }

        const property: EntityTemplateFormInputProperties = {
            id: uuid(),
            name: key,
            title: value.title,
            required: properties.required.includes(key),
            preview: propertiesPreview.includes(key),
            hide: properties.hide.includes(key),
            unique: uniqueConstraints[0]?.includes(key) ?? false, // UI supports only single unique constraint
            type,
            options: value.enum || [],
            pattern: value.pattern || '',
            patternCustomErrorMessage: value.patternCustomErrorMessage || '',
            dateNotification: value.dateNotification || '',
        };

        if (value.format === 'fileId') {
            attachmentProperties.push(property);
        } else {
            propertiesArray.push(property);
        }
    });

    if (iconFileId) {
        const file: Partial<File> = { name: iconFileId };
        return { ...restOfEntityTemplate, icon: { file, name: getFileName(iconFileId) }, properties: propertiesArray, attachmentProperties };
    }

    return { ...restOfEntityTemplate, properties: propertiesArray, attachmentProperties };
};

export const formToJSONSchema = (values: EntityTemplateWizardValues): IEntityTemplate => {
    const { properties, attachmentProperties, ...restOfProperties } = values;

    const propertiesOrder: string[] = [];
    const propertiesPreview: string[] = [];
    const uniqueConstraint: string[] = []; // UI supports only single unique constraint
    const schema: IEntityTemplate['properties'] = {
        type: 'object',
        properties: {},
        required: [],
        hide: [],
    };

    properties.forEach(({ name, title, type, required, preview, options, pattern, patternCustomErrorMessage, dateNotification, hide, unique }) => {
        schema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? (type as IEntitySingleProperty['type']) : 'string',
            format: stringFormats.includes(type) ? type : undefined,
            enum: type === 'enum' ? options : undefined,
            pattern: type === 'pattern' ? pattern : undefined,
            patternCustomErrorMessage: type === 'pattern' ? patternCustomErrorMessage : undefined,
            dateNotification: type === 'date' || type === 'date-time' ? dateNotification : undefined,
        };

        propertiesOrder.push(name);

        if (required) schema.required.push(name);
        if (hide) schema.hide.push(name);
        if (unique) uniqueConstraint.push(name);
        if (preview) propertiesPreview.push(name);
    });

    attachmentProperties.forEach(({ name, title, required }) => {
        schema.properties[name] = {
            title,
            type: 'string',
            format: 'fileId',
        };

        propertiesOrder.push(name);

        if (required) schema.required.push(name);
    });

    const uniqueConstraints = uniqueConstraint.length > 0 ? [uniqueConstraint] : [];

    return { ...restOfProperties, properties: schema, category: values.category._id, propertiesOrder, propertiesPreview, uniqueConstraints };
};

const createEntityTemplateRequest = async (newEntityTemplate: EntityTemplateWizardValues) => {
    const formData = new FormData();

    const entityTemplate = formToJSONSchema(newEntityTemplate);

    if (newEntityTemplate.icon) {
        formData.append('file', newEntityTemplate.icon.file as File);
    }

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('disabled', String(entityTemplate.disabled));
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));
    formData.append('propertiesOrder', JSON.stringify(entityTemplate.propertiesOrder));
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

const updateEntityTemplateRequest = async (entityTemplateId: string, updatedEntityTemplate: EntityTemplateWizardValues) => {
    const formData = new FormData();

    const entityTemplate = formToJSONSchema(updatedEntityTemplate);

    if (updatedEntityTemplate.icon) {
        if (updatedEntityTemplate.icon.file instanceof File) {
            formData.append('file', updatedEntityTemplate.icon.file);
        } else {
            formData.append('iconFileId', updatedEntityTemplate.icon.file.name!);
        }
    }

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));
    formData.append('propertiesOrder', JSON.stringify(entityTemplate.propertiesOrder));
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
