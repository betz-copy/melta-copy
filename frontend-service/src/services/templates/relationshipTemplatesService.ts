import {
    IConvertToRelationshipField,
    IEntityTemplateMap,
    IMongoEntityTemplatePopulated,
    IMongoEntityTemplateWithConstraintsPopulated,
    IMongoRelationshipTemplate,
    IRelationshipTemplate,
    ISearchRelationshipTemplatesBody,
} from '@microservices/shared';
import axios from '../../axios';
import { defaultInitialValues, RelationshipTemplateWizardValues } from '../../common/wizards/relationshipTemplate';
import { environment } from '../../globals';

const { relationshipTemplates } = environment.api;

const relationshipTemplateObjectToRelationshipTemplateForm = (
    entityTemplates: IEntityTemplateMap,
    relationshipTemplate: IMongoRelationshipTemplate | null,
): RelationshipTemplateWizardValues | undefined => {
    if (!relationshipTemplate) return undefined;
    const { sourceEntityId, destinationEntityId, ...restOfEntityTemplate } = relationshipTemplate;

    return {
        sourceEntity: entityTemplates.get(sourceEntityId)
            ? (entityTemplates.get(sourceEntityId) as IMongoEntityTemplateWithConstraintsPopulated)
            : (defaultInitialValues.sourceEntity as IMongoEntityTemplateWithConstraintsPopulated),
        destinationEntity: entityTemplates.get(destinationEntityId)
            ? (entityTemplates.get(destinationEntityId) as IMongoEntityTemplateWithConstraintsPopulated)
            : (defaultInitialValues.destinationEntity as IMongoEntityTemplateWithConstraintsPopulated),
        name: restOfEntityTemplate.name,
        displayName: restOfEntityTemplate.displayName,
    };
};

const relationshipTemplateFormToRelationshipTemplateObject = (
    relationshipTemplateWizardValues: Omit<RelationshipTemplateWizardValues, '_id'>,
): IRelationshipTemplate | IMongoRelationshipTemplate => {
    const { sourceEntity, destinationEntity, ...restOfRelationshipWizardValues } = relationshipTemplateWizardValues;
    return {
        // TODO: Check if true
        isProperty: false,
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

const convertToRelationshipFieldRequest = async (relationshipTemplateId: string, updatedData: IConvertToRelationshipField) => {
    const { data } = await axios.put<{
        updatedRelationShipTemplate: IMongoRelationshipTemplate;
        updatedEntityTemplate: IMongoEntityTemplatePopulated;
    }>(`${relationshipTemplates}/convertToRelationshipField/${relationshipTemplateId}`, updatedData);
    return data;
};

const deleteRelationshipTemplateRequest = async (relationshipTemplateId: string) => {
    const { data } = await axios.delete<IMongoRelationshipTemplate>(`${relationshipTemplates}/${relationshipTemplateId}`);
    return data;
};

const searchRelationshipTemplates = async (searchBody: ISearchRelationshipTemplatesBody) => {
    const { data } = await axios.post<IMongoRelationshipTemplate[]>(`${relationshipTemplates}/search`, searchBody);
    return data;
};

const getAllRelationshipTemplatesRequest = async () => {
    const { data } = await axios.get<IMongoRelationshipTemplate[]>(`${relationshipTemplates}/all`);
    return data;
};

export {
    createRelationshipTemplateRequest,
    updateRelationshipTemplateRequest,
    convertToRelationshipFieldRequest,
    deleteRelationshipTemplateRequest,
    relationshipTemplateObjectToRelationshipTemplateForm,
    relationshipTemplateFormToRelationshipTemplateObject,
    searchRelationshipTemplates,
    getAllRelationshipTemplatesRequest,
};
