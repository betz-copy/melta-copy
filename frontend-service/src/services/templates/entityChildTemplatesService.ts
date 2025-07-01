import axios from '../../axios';
import { IEntityChildTemplate, IMongoChildEntityTemplate, IMongoChildEntityTemplatePopulated } from '../../interfaces/entityChildTemplates';
import { environment } from '../../globals';

const { entityChildTemplates } = environment.api;

const createEntityChildTemplate = async (newEntityChildTemplate: IEntityChildTemplate) => {
    const { data } = await axios.post<IMongoChildEntityTemplate>(entityChildTemplates, newEntityChildTemplate);
    return data;
};

const updateEntityChildTemplate = async (id: string, childTemplate: IEntityChildTemplate) => {
    const { data } = await axios.put<IMongoChildEntityTemplate>(`${entityChildTemplates}/${id}`, childTemplate);
    return data;
};

const getAllEntityChildTemplates = async () => {
    const { data } = await axios.get<IMongoChildEntityTemplatePopulated[]>(entityChildTemplates);
    return data;
};

const deleteEntityChildTemplate = async (id: string) => {
    const { data } = await axios.delete<IMongoChildEntityTemplate>(`${entityChildTemplates}/${id}`);
    return data;
};

export { createEntityChildTemplate, updateEntityChildTemplate, getAllEntityChildTemplates, deleteEntityChildTemplate };
