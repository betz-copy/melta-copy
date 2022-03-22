import axios from '../axios';
import { EntityTemplateWizardValues } from '../common/wizards/entityTemplate';
import { environment } from '../globals';
import { IEntityTemplate, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

const { entityTemplates } = environment.api;
const basePropertyTypes = ['string', 'number', 'boolean'];

const formToJSONSchema = (values: EntityTemplateWizardValues) => {
    const { requiredProrerites, optionalProrerites, ...restOfProperties } = values;

    const schema = {
        type: 'object',
        properties: {} as any,
        required: [] as string[],
    };

    requiredProrerites.forEach(({ name, title, type }) => {
        schema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? type : 'string',
            format: basePropertyTypes.includes(type) ? undefined : type,
        };

        schema.required.push(name);
    });

    optionalProrerites.forEach(({ name, title, type }) => {
        schema.properties[name] = {
            title,
            type: basePropertyTypes.includes(type) ? type : 'string',
            format: basePropertyTypes.includes(type) ? undefined : type,
        };
    });

    return { ...restOfProperties, properties: schema, category: values.category._id } as IEntityTemplate;
};

const getEntityTemplatesRequest = async () => {
    const { data } = await axios.get<IMongoEntityTemplatePopulated[]>(entityTemplates);
    return data;
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
        formData.append('file', updatedEntityTemplate.file as File);
    }

    formData.append('displayName', entityTemplate.displayName);
    formData.append('name', entityTemplate.name);
    formData.append('category', entityTemplate.category);
    formData.append('properties', JSON.stringify(entityTemplate.properties));

    const { data } = await axios.put<IMongoEntityTemplatePopulated>(`${entityTemplates}/${entityTemplateId}`, updatedEntityTemplate);
    return data;
};

export { getEntityTemplatesRequest, createEntityTemplateRequest, updateEntityTemplateRequest };
