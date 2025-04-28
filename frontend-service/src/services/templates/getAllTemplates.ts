import {
    IMongoEntityTemplatePopulated,
    IMongoRelationshipTemplate,
    IMongoCategory,
    IMongoRule,
    IMongoProcessTemplateReviewerPopulated,
} from '@microservices/shared-interfaces';
import { environment } from '../../globals';
import axios from '../../axios';

const { getAllTemplates: getAllTemplatesRoute } = environment.api;

export type GetAllTemplatesType = {
    categories: IMongoCategory[];
    entityTemplates: IMongoEntityTemplatePopulated[];
    relationshipTemplates: IMongoRelationshipTemplate[];
    processTemplates: IMongoProcessTemplateReviewerPopulated[];
    rules: IMongoRule[];
};

const getAllTemplates = async () => {
    const { data } = await axios.get<GetAllTemplatesType>(getAllTemplatesRoute);
    return data;
};

export { getAllTemplates };
