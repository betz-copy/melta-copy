import axios from '../axios';
import { environment } from '../globals';
import { IEntityTemplate, IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

const { entityTemplates } = environment.api;

const getEntityTemplatesRequest = async () => {
    const { data } = await axios.get<IMongoEntityTemplatePopulated[]>(entityTemplates);
    return data;
};

const createEntityTemplateRequest = async (newEntityTemplate: IEntityTemplate) => {
    const { data } = await axios.post<IMongoEntityTemplatePopulated>(entityTemplates, newEntityTemplate);
    return data;
};

const updateEntityTemplateRequest = async (entityTemplateId: string, updatedEntityTemplate: IEntityTemplate) => {
    const { data } = await axios.put<IMongoEntityTemplatePopulated>(`${entityTemplates}/${entityTemplateId}`, updatedEntityTemplate);
    return data;
};

export { getEntityTemplatesRequest, createEntityTemplateRequest, updateEntityTemplateRequest };
