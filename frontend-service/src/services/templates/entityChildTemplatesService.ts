import axios from '../../axios';
import { IEntityChildTemplate, IMongoChildEntityTemplate, IMongoChildEntityTemplatePopulated } from '../../interfaces/entityChildTemplates';
import { environment } from '../../globals';

const { entityChildTemplates, simbaRoutes } = environment.api;

const createEntityChildTemplateRequest = async (newEntityChildTemplate: IEntityChildTemplate) => {
    const { data } = await axios.post<IMongoChildEntityTemplate>(entityChildTemplates, newEntityChildTemplate);
    return data;
};

const getAllEntityChildTemplatesRequest = async () => {
    const { data } = await axios.get<IMongoChildEntityTemplate[]>(entityChildTemplates);
    return data;
};

const getEntityChildTemplateByIdRequest = async (id: string) => {
    const { data } = await axios.get<IMongoChildEntityTemplatePopulated>(`${simbaRoutes}/${id}`);
    return data;
};

export { createEntityChildTemplateRequest, getAllEntityChildTemplatesRequest, getEntityChildTemplateByIdRequest };
