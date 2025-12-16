import { IMongoEntityTemplateWithConstraintsPopulated, IMongoRelationshipTemplatePopulated } from '@microservices/shared';

const isRelationshipMatchSourceAndDestTemplate = (
    relationshipTemplate: IMongoRelationshipTemplatePopulated,
    sourceEntityTemplatesToShow: IMongoEntityTemplateWithConstraintsPopulated[],
    destinationEntityTemplatesToShow: IMongoEntityTemplateWithConstraintsPopulated[],
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
    sourceEntityTemplatesToShow: IMongoEntityTemplateWithConstraintsPopulated[];
    destinationEntityTemplatesToShow: IMongoEntityTemplateWithConstraintsPopulated[];
}) => {
    const { relationshipTemplates, searchText, sourceEntityTemplatesToShow, destinationEntityTemplatesToShow } = filterData;
    return relationshipTemplates.filter(
        (relationshipTemplate) =>
            isRelationshipMatchSourceAndDestTemplate(relationshipTemplate, sourceEntityTemplatesToShow, destinationEntityTemplatesToShow) &&
            isRelationshipMatchSearchText(relationshipTemplate, searchText),
    );
};
