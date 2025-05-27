import axios from '../../axios';
import { IEntityChildTemplate, IMongoChildEntityTemplate } from '../../interfaces/entityChildTemplates';
import { environment } from '../../globals';

const { entityChildTemplates } = environment.api;

const createEntityChildTemplateRequest = async (newEntityChildTemplate: IEntityChildTemplate) => {
    const { data } = await axios.post<IMongoChildEntityTemplate>(entityChildTemplates, newEntityChildTemplate);
    return data;
};

const updateEntityChildTemplateRequest = async (id: string, childTemplate: IEntityChildTemplate) => {
    const { data } = await axios.put<IMongoChildEntityTemplate>(`${entityChildTemplates}/${id}`, childTemplate);
    return data;
};

const getAllEntityChildTemplatesRequest = async () => {
    const { data } = await axios.get<IMongoChildEntityTemplate[]>(entityChildTemplates);
    return data;
};

export { createEntityChildTemplateRequest, updateEntityChildTemplateRequest, getAllEntityChildTemplatesRequest };
