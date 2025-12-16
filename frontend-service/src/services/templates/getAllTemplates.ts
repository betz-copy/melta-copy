import {
    IMongoCategory,
    IMongoChildTemplateWithConstraintsPopulated,
    IMongoEntityTemplateWithConstraintsPopulated,
    IMongoPrintingTemplate,
    IMongoProcessTemplateReviewerPopulated,
    IMongoRelationshipTemplate,
    IMongoRule,
} from '@microservices/shared';
import axios from '../../axios';
import { environment } from '../../globals';
import { IMongoCategoryOrderConfig } from '../../interfaces/config';

const { getAllTemplates: getAllTemplatesRoute } = environment.api;

export type GetAllTemplatesType = {
    categories: IMongoCategory[];
    categoryOrder: IMongoCategoryOrderConfig;
    entityTemplates: IMongoEntityTemplateWithConstraintsPopulated[];
    relationshipTemplates: IMongoRelationshipTemplate[];
    processTemplates: IMongoProcessTemplateReviewerPopulated[];
    rules: IMongoRule[];
    childTemplates: IMongoChildTemplateWithConstraintsPopulated[];
    printingTemplates: IMongoPrintingTemplate[];
};

const getAllTemplates = async () => {
    const { data } = await axios.get<GetAllTemplatesType>(getAllTemplatesRoute);
    return data;
};

export { getAllTemplates };
