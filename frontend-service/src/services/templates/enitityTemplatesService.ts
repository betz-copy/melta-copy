import { v4 as uuid } from 'uuid';
import axios from '../../axios';
import { EntityTemplateFormInputProperties, EntityTemplateWizardValues } from '../../common/wizards/entityTemplate';
import { environment } from '../../globals';
import { IEntityTemplate, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

const { entityTemplates } = environment.api;
export const basePropertyTypes = ['string', 'number', 'boolean'];
export const stringFormats = ['date', 'date-time', 'email'];

const entityTemplateObjectToEntityTemplateForm = (entityTemplate: IMongoEntityTemplatePopulated | null): EntityTemplateWizardValues | undefined => {
    if (!entityTemplate) return undefined;
    const { iconFileId, properties, propertiesOrder, propertiesPreview, ...restOfEntityTemplate } = entityTemplate;

    const propertiesArray: EntityTemplateFormInputProperties[] = [];
    const attachmentProperties: EntityTemplateFormInputProperties[] = [];

    propertiesOrder.forEach((key) => {
        const value = properties.properties[key];

        if (value.format === 'fileId') {
            attachmentProperties.push({
                id: uuid(),
                name: key,
                ...value,
                required: properties.required.includes(key),
                preview: propertiesPreview.includes(key),
                type: value.format,
                options: [],
            });
        } else {
            const type = value.enum ? 'enum' : value.format || value.type;

            propertiesArray.push({
                id: uuid(),
                name: key,
                ...value,
                required: properties.required.includes(key),
                preview: propertiesPreview.includes(key),
                type,
                options: value.enum || [],
            });
        }
    });

    if (iconFileId) {
        const file: Partial<File> = { name: iconFileId };
        return { ...restOfEntityTemplate, file, properties: propertiesArray, attachmentProperties };
    }

    return { ...restOfEntityTemplate, properties: propertiesArray, attachmentProperties };
};

const formToJSONSchema = (values: EntityTemplateWizardValues): IEntityTemplate => {
    const { properties, attachmentProperties, ...restOfProperties } = values;

    const propertiesOrder: string[] = [];
    const propertiesPreview: string[] = [];
    const schema = {
        type: 'object' as 'object',
        properties: {} as any,
        required: [] as string[],
    };

    properties.forEach(({ name, title, type, required, preview, options }) => {
        schema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? type : 'string',
            format: stringFormats.includes(type) ? type : undefined,
            enum: type === 'enum' ? options : undefined,
        };

        propertiesOrder.push(name);

        if (required) schema.required.push(name);
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

    return { ...restOfProperties, properties: schema, category: values.category._id, propertiesOrder, propertiesPreview };
};

const createEntityTemplateRequest = async (newEntityTemplate: EntityTemplateWizardValues) => {
    const formData = new FormData();

    const entityTemplate = formToJSONSchema(newEntityTemplate);

    if (newEntityTemplate.file) {
        formData.append('file', newEntityTemplate.file as File);
    }

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));
    formData.append('propertiesOrder', JSON.stringify(entityTemplate.propertiesOrder));
    formData.append('propertiesPreview', JSON.stringify(entityTemplate.propertiesPreview));

    const { data } = await axios.post<IMongoEntityTemplatePopulated>(entityTemplates, formData);
    return data;
};

const updateEntityTemplateRequest = async (entityTemplateId: string, updatedEntityTemplate: EntityTemplateWizardValues) => {
    const formData = new FormData();

    const entityTemplate = formToJSONSchema(updatedEntityTemplate);

    if (updatedEntityTemplate.file) {
        if (updatedEntityTemplate.file instanceof File) {
            formData.append('file', updatedEntityTemplate.file);
        } else {
            formData.append('iconFileId', updatedEntityTemplate.file.name!);
        }
    }

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));
    formData.append('propertiesOrder', JSON.stringify(entityTemplate.propertiesOrder));
    formData.append('propertiesPreview', JSON.stringify(entityTemplate.propertiesPreview));

    const { data } = await axios.put<IMongoEntityTemplatePopulated>(`${entityTemplates}/${entityTemplateId}`, formData);
    return data;
};

const deleteEntityTemplateRequest = async (entityTemplateId: string) => {
    const { data } = await axios.delete(`${entityTemplates}/${entityTemplateId}`);
    return data;
};

export { createEntityTemplateRequest, updateEntityTemplateRequest, entityTemplateObjectToEntityTemplateForm, deleteEntityTemplateRequest };
