import axios from '../../axios';
import { environment } from '../../globals';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoRelationshipTemplateRule } from '../../interfaces/rules';

const { getAllTemplates: getAllTemplatesRoute } = environment.api;

export type GetAllTemplatesType = {
    categories: IMongoCategory[];
    entityTemplates: IMongoEntityTemplatePopulated[];
    relationshipTemplates: IMongoRelationshipTemplate[];
    rules: IMongoRelationshipTemplateRule[];
};

const getAllTemplates = async () => {
    const { data } = await axios.get<GetAllTemplatesType>(getAllTemplatesRoute);
    return data;
};

export { getAllTemplates };
