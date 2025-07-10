import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { IMongoRelationshipTemplatePopulated } from '../interfaces/relationshipTemplates';

const isRelationshipMatchSourceAndDestTemplate = (
    relationshipTemplate: IMongoRelationshipTemplatePopulated,
    sourceEntityTemplatesToShow: IMongoEntityTemplatePopulated[],
    destinationEntityTemplatesToShow: IMongoEntityTemplatePopulated[],
) => {
    return (
        sourceEntityTemplatesToShow.some((sourceEntityTemplateToShow) => sourceEntityTemplateToShow._id === relationshipTemplate.sourceEntity._id) &&
        destinationEntityTemplatesToShow.some(
            (destinationEntityTemplateToShow) => destinationEntityTemplateToShow._id === relationshipTemplate.destinationEntity._id,
        )
    );
};

const isRelationshipMatchSearchText = (relationshipTemplate: IMongoRelationshipTemplatePopulated, searchText: string) => {
    return (
        searchText === '' ||
        relationshipTemplate.displayName.includes(searchText) ||
        relationshipTemplate.sourceEntity.displayName.includes(searchText) ||
        relationshipTemplate.destinationEntity.displayName.includes(searchText)
    );
};

export const filterRelationships = (filterData: {
    relationshipTemplates: IMongoRelationshipTemplatePopulated[];
    searchText: string;
    sourceEntityTemplatesToShow: IMongoEntityTemplatePopulated[];
    destinationEntityTemplatesToShow: IMongoEntityTemplatePopulated[];
}) => {
    const { relationshipTemplates, searchText, sourceEntityTemplatesToShow, destinationEntityTemplatesToShow } = filterData;
    return relationshipTemplates.filter(
        (relationshipTemplate) =>
            isRelationshipMatchSourceAndDestTemplate(relationshipTemplate, sourceEntityTemplatesToShow, destinationEntityTemplatesToShow) &&
            isRelationshipMatchSearchText(relationshipTemplate, searchText),
    );
};
