import { IMongoCategory } from '@packages/category';
import { IMongoChildTemplateWithConstraintsPopulated } from '@packages/child-template';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IMongoPrintingTemplate } from '@packages/printing-template';
import { IMongoProcessTemplateReviewerPopulated } from '@packages/process';
import { IMongoRelationshipTemplate } from '@packages/relationship-template';
import { IMongoRule } from '@packages/rule';
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
