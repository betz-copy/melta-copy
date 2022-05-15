import axios from '../../axios';
import { EntityTemplateFormInputProperties, EntityTemplateWizardValues } from '../../common/wizards/entityTemplate';
import { environment } from '../../globals';
import { IEntityTemplate, IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';

const { entityTemplates } = environment.api;
const basePropertyTypes = ['string', 'number', 'boolean'];

const entityTemplateObjectToEntityTemplateForm = (entityTemplate: IMongoEntityTemplatePopulated | null): EntityTemplateWizardValues | undefined => {
    if (!entityTemplate) return undefined;
    const { iconFileId, properties, ...restOfEntityTemplate } = entityTemplate;

    const propertiesArray: EntityTemplateFormInputProperties[] = [];
    const attachmentProperties: EntityTemplateFormInputProperties[] = [];

    Object.entries(properties.properties).forEach(([key, value]) => {
        propertiesArray.push({ name: key, ...value, required: properties.required.includes(key) });
    });

    if (iconFileId) {
        const file: Partial<File> = { name: iconFileId };
        return { ...restOfEntityTemplate, file, properties: propertiesArray, attachmentProperties };
    }

    return { ...restOfEntityTemplate, properties: propertiesArray, attachmentProperties };
};

const formToJSONSchema = (values: EntityTemplateWizardValues) => {
    const { properties, attachmentProperties, ...restOfProperties } = values;

    const schema = {
        type: 'object',
        properties: {} as any,
        required: [] as string[],
    };

    properties.forEach(({ name, title, type, required }) => {
        schema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? type : 'string',
            format: basePropertyTypes.includes(type) ? undefined : type,
        };

        if (required) schema.required.push(name);
    });

    attachmentProperties.forEach(({ name, title, required }) => {
        schema.properties[name] = {
            title,
            type: 'string',
            format: 'fileId',
        };

        if (required) schema.required.push(name);
    });

    return { ...restOfProperties, properties: schema, category: values.category._id } as IEntityTemplate;
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

    const { data } = await axios.put<IMongoEntityTemplatePopulated>(`${entityTemplates}/${entityTemplateId}`, formData);
    return data;
};

const deleteEntityTemplateRequest = async (entityTemplateId: string) => {
    const { data } = await axios.delete(`${entityTemplates}/${entityTemplateId}`);
    return data;
};

export { createEntityTemplateRequest, updateEntityTemplateRequest, entityTemplateObjectToEntityTemplateForm, deleteEntityTemplateRequest };
