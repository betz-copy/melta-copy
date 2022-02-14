import axios from '../axios';
import { environment } from '../globals';

const { relationshipTemplates } = environment.api;

const createRelationshipTemplateRequest = async (newRelationshipTemplate: any) => {
    const { data } = await axios.post(relationshipTemplates, newRelationshipTemplate);
    return data;
};

export { createRelationshipTemplateRequest };
