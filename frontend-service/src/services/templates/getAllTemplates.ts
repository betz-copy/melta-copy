import axios from '../../axios';
import { environment } from '../../globals';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate } from '../../interfaces/relationshipTemplates';
import { IMongoCategory } from '../../interfaces/categories';
import { IMongoRule } from '../../interfaces/rules';
import { IMongoProcessTemplatePopulated } from '../../interfaces/processes/processTemplate';
import { IMongoChildTemplate } from '../../interfaces/childTemplates';
import { IMongoCategoryOrderConfig } from '../../interfaces/config';

const { getAllTemplates: getAllTemplatesRoute } = environment.api;

export type GetAllTemplatesType = {
    categories: IMongoCategory[];
    categoryOrder: IMongoCategoryOrderConfig;
    entityTemplates: IMongoEntityTemplatePopulated[];
    relationshipTemplates: IMongoRelationshipTemplate[];
    processTemplates: IMongoProcessTemplatePopulated[];
    rules: IMongoRule[];
    childTemplates: IMongoChildTemplate[];
};

const getAllTemplates = async () => {
    const { data } = await axios.get<GetAllTemplatesType>(getAllTemplatesRoute);
    return data;
};

export { getAllTemplates };
