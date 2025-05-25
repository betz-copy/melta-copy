import axios from '../../axios';
import { IEntityChildTemplate, IMongoChildEntityTemplate } from '../../common/dialogs/createChildTemplate/interfaces';
import { environment } from '../../globals';

const { entityChildTemplates } = environment.api;

const createEntityChildTemplateRequest = async (newEntityChildTemplate: IEntityChildTemplate) => {
    const { data } = await axios.post<IMongoChildEntityTemplate>(entityChildTemplates, newEntityChildTemplate);
    return data;
};

const getAllEntityChildTemplatesRequest = async () => {
    const { data } = await axios.get<IMongoChildEntityTemplate[]>(entityChildTemplates);
    return data;
};

export { createEntityChildTemplateRequest, getAllEntityChildTemplatesRequest };
