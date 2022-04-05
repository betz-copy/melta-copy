import axios from '../axios';
import { RelationshipTemplateWizardValues } from '../common/wizards/relationshipTemplate';
import { environment } from '../globals';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IRelationshipTemplate } from '../interfaces/relationshipTemplates';

const { relationshipTemplates } = environment.api;

const relationshipTemplateObjectToRelationshipTemplateForm = (
    entityTemplates: IMongoEntityTemplatePopulated[],
    relationshipTemplate: IMongoRelationshipTemplate | null,
): RelationshipTemplateWizardValues | undefined => {
    if (!relationshipTemplate) return undefined;
    const { sourceEntityId, destinationEntityId, ...restOfEntityTemplate } = relationshipTemplate;

    const sourceEntity = entityTemplates.find((entityTemplate) => entityTemplate._id === sourceEntityId)!;
    const destinationEntity = entityTemplates.find((entityTemplate) => entityTemplate._id === destinationEntityId)!;

    return { sourceEntity, destinationEntity, ...restOfEntityTemplate };
};

const getRelationshipTemplatesRequest = async () => {
    const { data } = await axios.get<IRelationshipTemplate[]>(relationshipTemplates);
    return data;
};

const createRelationshipTemplateRequest = async (newRelationshipTemplate: any) => {
    const { data } = await axios.post(relationshipTemplates, newRelationshipTemplate);
    return data;
};

const updateRelationshipTemplateRequest = async (relationshipTemplateId: string, newRelationshipTemplate: any) => {
    const { data } = await axios.put(`${relationshipTemplates}/${relationshipTemplateId}`, newRelationshipTemplate);
    return data;
};

const deleteRelationshipTemplateRequest = async (relationshipTemplateId: string) => {
    const { data } = await axios.delete(`${relationshipTemplates}/${relationshipTemplateId}`);
    return data;
};

export {
    getRelationshipTemplatesRequest,
    createRelationshipTemplateRequest,
    updateRelationshipTemplateRequest,
    deleteRelationshipTemplateRequest,
    relationshipTemplateObjectToRelationshipTemplateForm,
};
