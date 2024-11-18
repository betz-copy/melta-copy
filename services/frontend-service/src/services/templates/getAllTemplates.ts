import { IMongoEntityTemplatePopulated, IMongoRelationshipTemplate, IMongoCategory } from '@microservices/shared';
import { environment } from '../../globals';
import axios from '../../axios';
import { IMongoRule } from '../../interfaces/rules';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';

const { getAllTemplates: getAllTemplatesRoute } = environment.api;

export type GetAllTemplatesType = {
    categories: IMongoCategory[];
    entityTemplates: IMongoEntityTemplatePopulated[];
    relationshipTemplates: IMongoRelationshipTemplate[];
    processTemplates: IMongoProcessTemplatePopulated[];
    rules: IMongoRule[];
};

const getAllTemplates = async () => {
    const { data } = await axios.get<GetAllTemplatesType>(getAllTemplatesRoute);
    return data;
};

export { getAllTemplates };
