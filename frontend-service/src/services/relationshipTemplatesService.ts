import axios from '../axios';
import { environment } from '../globals';
import { IRelationshipTemplate } from '../interfaces/relationshipTemplates';

const { relationshipTemplates } = environment.api;

const getRelationshipTemplatesRequest = async () => {
    const { data } = await axios.get<IRelationshipTemplate[]>(relationshipTemplates);
    return data;
};

const createRelationshipTemplateRequest = async (newRelationshipTemplate: any) => {
    const { data } = await axios.post(relationshipTemplates, newRelationshipTemplate);
    return data;
};

export { getRelationshipTemplatesRequest, createRelationshipTemplateRequest };
