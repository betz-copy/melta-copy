import axios from '../../axios';
import { IChildTemplate, IMongoChildTemplate, IMongoChildTemplatePopulated } from '../../interfaces/childTemplates';
import { environment } from '../../globals';

const { entityChildTemplates } = environment.api;

const createEntityChildTemplate = async (newEntityChildTemplate: IChildTemplate) => {
    const { data } = await axios.post<IMongoChildTemplate>(entityChildTemplates, newEntityChildTemplate);
    return data;
};

const updateEntityChildTemplate = async (id: string, childTemplate: IChildTemplate) => {
    const { data } = await axios.put<IMongoChildTemplate>(`${entityChildTemplates}/${id}`, childTemplate);
    return data;
};

const getAllEntityChildTemplates = async () => {
    const { data } = await axios.get<IMongoChildTemplatePopulated[]>(entityChildTemplates);
    return data;
};

const deleteEntityChildTemplate = async (id: string) => {
    const { data } = await axios.delete<IMongoChildTemplate>(`${entityChildTemplates}/${id}`);
    return data;
};

export { createEntityChildTemplate, updateEntityChildTemplate, getAllEntityChildTemplates, deleteEntityChildTemplate };
