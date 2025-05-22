import axios from '../../axios';
import { IEntityChildTemplate, IMongoEntityChildTemplate } from '../../interfaces/entityChildTemplates';
import { environment } from '../../globals';

const { entityChildTemplates } = environment.api;

const createEntityChildTemplateRequest = async (newEntityChildTemplate: IEntityChildTemplate) => {
    const { data } = await axios.post<IMongoEntityChildTemplate>(entityChildTemplates, newEntityChildTemplate);
    return data;
};

const getAllEntityChildTemplatesRequest = async () => {
    const { data } = await axios.get<IMongoEntityChildTemplate[]>(entityChildTemplates);
    return data;
};

export { createEntityChildTemplateRequest, getAllEntityChildTemplatesRequest };
