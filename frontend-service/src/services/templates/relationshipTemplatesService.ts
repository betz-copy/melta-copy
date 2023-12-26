import axios from '../../axios';
import { RelationshipTemplateWizardValues } from '../../common/wizards/relationshipTemplate';
import { environment } from '../../globals';
import { IEntityTemplateMap } from '../../interfaces/entityTemplates';
import { IMongoRelationshipTemplate, IRelationshipTemplate } from '../../interfaces/relationshipTemplates';

const { relationshipTemplates } = environment.api;

const relationshipTemplateObjectToRelationshipTemplateForm = (
    entityTemplates: IEntityTemplateMap,
    relationshipTemplate: IMongoRelationshipTemplate | null,
): RelationshipTemplateWizardValues | undefined => {
    if (!relationshipTemplate) return undefined;
    const { sourceEntityId, destinationEntityId, ...restOfEntityTemplate } = relationshipTemplate;

    return {
        sourceEntity: entityTemplates.get(sourceEntityId)!,
        destinationEntity: entityTemplates.get(destinationEntityId)!,
        ...restOfEntityTemplate,
    };
};

const relationshipTemplateFormToRelationshipTemplateObject = (
    relationshipTemplateWizardValues: Omit<RelationshipTemplateWizardValues, '_id'>,
): IRelationshipTemplate | IMongoRelationshipTemplate => {
    const { sourceEntity, destinationEntity, ...restOfRelationshipWizardValues } = relationshipTemplateWizardValues;
    return {
        ...restOfRelationshipWizardValues,
        sourceEntityId: sourceEntity._id,
        destinationEntityId: destinationEntity._id,
    };
};

const createRelationshipTemplateRequest = async (newRelationshipTemplate: IRelationshipTemplate) => {
    const { data } = await axios.post<IMongoRelationshipTemplate>(relationshipTemplates, newRelationshipTemplate);
    return data;
};

const updateRelationshipTemplateRequest = async (relationshipTemplateId: string, newRelationshipTemplate: IRelationshipTemplate) => {
    const { data } = await axios.put<IMongoRelationshipTemplate>(`${relationshipTemplates}/${relationshipTemplateId}`, newRelationshipTemplate);
    return data;
};

const deleteRelationshipTemplateRequest = async (relationshipTemplateId: string) => {
    const { data } = await axios.delete<IMongoRelationshipTemplate>(`${relationshipTemplates}/${relationshipTemplateId}`);
    return data;
};

export {
    createRelationshipTemplateRequest,
    updateRelationshipTemplateRequest,
    deleteRelationshipTemplateRequest,
    relationshipTemplateObjectToRelationshipTemplateForm,
    relationshipTemplateFormToRelationshipTemplateObject,
};
