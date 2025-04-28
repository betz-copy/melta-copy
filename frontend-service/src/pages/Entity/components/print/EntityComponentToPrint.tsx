import React from 'react';
import { IEntity, IEntityTemplateMap, IMongoEntityTemplatePopulated, IMongoRelationshipTemplatePopulated } from '@microservices/shared-interfaces';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import { Box, SxProps, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { EntityDisableCheckbox } from '../EntityDisableCheckbox';
import { EntityDates } from '../EntityDates';
import { BlueTitle } from '../../../../common/BlueTitle';
import { ConnectionWithExtendedRelationship, IConnectionTemplateExpanded } from '.';

interface RelationshipPrintTitleProps {
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    isExpandedEntityRelationshipSource: boolean;
    fontSize?: string;
    index?: number;
    sxOverride?: SxProps;
}

export const RelationshipPrintTitle: React.FC<RelationshipPrintTitleProps> = ({
    relationshipTemplate,
    isExpandedEntityRelationshipSource,
    fontSize,
    index,
    sxOverride,
}) => {
    const { destinationEntity, sourceEntity, displayName } = relationshipTemplate;

    return (
        <Box display="flex" alignItems="center" sx={{ ...sxOverride, gap: '7px' }}>
            {index && (
                <Typography variant="h6" fontSize={fontSize ?? '26px'} color="gray">
                    {`${index}.`}
                </Typography>
            )}
            <Typography variant="h6" fontSize={fontSize ?? '26px'} color="gray" fontWeight={isExpandedEntityRelationshipSource ? '900' : undefined}>
                {sourceEntity.displayName}
            </Typography>

            <Typography fontWeight="800" color="primary" component="h5" variant="h6" fontSize={fontSize ?? '26px'}>
                {displayName}
            </Typography>

            <Typography variant="h6" fontSize={fontSize ?? '26px'} color="gray" fontWeight={isExpandedEntityRelationshipSource ? undefined : '900'}>
                {destinationEntity.displayName}
            </Typography>
        </Box>
    );
};

const EntityComponentToPrint: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    entity: IEntity;
    options?: { showDates?: boolean };
    showPreviewPropertiesOnly?: boolean;
    expandedRelationships?: { instances: ConnectionWithExtendedRelationship[]; templates: IConnectionTemplateExpanded[] };
}> = ({ entityTemplate, entity, options = { showDates: true }, showPreviewPropertiesOnly, expandedRelationships }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;

    const theme = useTheme();

    return (
        <Box border={`2px solid ${theme.palette.primary.main}`} borderRadius="20px" padding="1rem">
            <Box padding="0.2rem">
                <EntityPropertiesInternal
                    properties={entity.properties}
                    entityTemplate={entityTemplate}
                    darkMode={false}
                    showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                    mode="normal"
                    textWrap
                    isPrintingMode
                />
            </Box>
            <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled} />
            {options.showDates && <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} toPrint />}

            {expandedRelationships &&
                expandedRelationships.instances.some((_outerInstance) =>
                    expandedRelationships.templates.some((expandedTemplate) => {
                        const expandedRelationship = expandedRelationships.instances.find(
                            (innerInstance) =>
                                (expandedTemplate.relationshipTemplate._id === innerInstance.relationship.templateId &&
                                    entity.properties._id === innerInstance.sourceEntity.properties._id) ||
                                entity.properties._id === innerInstance.destinationEntity.properties._id,
                        );
                        return expandedRelationship !== undefined;
                    }),
                ) && (
                    <div>
                        <BlueTitle title={i18next.t('entityPage.print.relationships')} component="p" variant="h6" style={{ marginTop: '5px' }} />
                        {expandedRelationships.templates.map((expandedTemplate, index) => {
                            const expandedRelationship = expandedRelationships.instances.find(
                                (instance) =>
                                    (expandedTemplate.relationshipTemplate._id === instance.relationship.templateId &&
                                        entity.properties._id === instance.sourceEntity.properties._id) ||
                                    entity.properties._id === instance.destinationEntity.properties._id,
                            );

                            if (!expandedRelationship) return <div key={expandedTemplate.relationshipTemplate._id} />;

                            const relatedEntity = expandedTemplate.isExpandedEntityRelationshipSource
                                ? expandedRelationship.sourceEntity
                                : expandedRelationship.destinationEntity;

                            return (
                                <div key={relatedEntity.properties._id}>
                                    <RelationshipPrintTitle
                                        relationshipTemplate={expandedTemplate.relationshipTemplate}
                                        isExpandedEntityRelationshipSource={expandedTemplate.isExpandedEntityRelationshipSource}
                                        fontSize="17px"
                                        index={index + 1}
                                        sxOverride={{ marginTop: '0.5rem' }}
                                    />
                                    <Box>
                                        <EntityPropertiesInternal
                                            properties={relatedEntity.properties}
                                            entityTemplate={entityTemplates.get(relatedEntity.templateId)!}
                                            darkMode={false}
                                            showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                                            mode="normal"
                                            textWrap
                                            isPrintingMode
                                        />
                                    </Box>
                                </div>
                            );
                        })}
                    </div>
                )}
        </Box>
    );
};
export { EntityComponentToPrint };
