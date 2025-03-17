import React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import { IEntity } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { EntityDisableCheckbox } from '../EntityDisableCheckbox';
import { EntityDates } from '../EntityDates';
import { IExpandedRelationship } from '.';
import { BlueTitle } from '../../../../common/BlueTitle';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';

interface RelationshipPrintTitleProps {
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    isExpandedEntityRelationshipSource: boolean;
    fontSize?: string;
}

export const RelationshipPrintTitle: React.FC<RelationshipPrintTitleProps> = ({
    relationshipTemplate,
    isExpandedEntityRelationshipSource,
    fontSize,
}) => {
    const { destinationEntity, sourceEntity, displayName } = relationshipTemplate;

    return (
        <Box display="flex" alignItems="center" marginTop="2rem" marginBottom="0.5rem">
            <Typography variant="h4" fontSize={fontSize ?? '26px'} color="gray" fontWeight={isExpandedEntityRelationshipSource ? '900' : undefined}>
                {sourceEntity.displayName}
            </Typography>

            <Typography
                paddingRight="7px"
                paddingLeft="7px"
                fontWeight="800"
                color="primary"
                component="h5"
                variant="h5"
                fontSize={fontSize ?? '26px'}
            >
                {displayName}
            </Typography>

            <Typography variant="h4" fontSize={fontSize ?? '26px'} color="gray" fontWeight={isExpandedEntityRelationshipSource ? undefined : '900'}>
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
    expandedRelationships?: IExpandedRelationship[];
}> = ({ entityTemplate, entity, options = { showDates: true }, showPreviewPropertiesOnly, expandedRelationships }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationshipTemplates = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

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

            {expandedRelationships && expandedRelationships.length > 0 && (
                <>
                    <BlueTitle title={i18next.t('entityPage.print.relationships')} component="p" variant="subtitle1" />
                    {expandedRelationships.map((expandedRelationship, index) => {
                        const relatedEntity = expandedRelationship.isMainEntityIsRelationshipSource
                            ? expandedRelationship.destinationEntity
                            : expandedRelationship.sourceEntity;
                        return (
                            <>
                                <Grid>
                                    {`${index + 1}.`}
                                    <RelationshipPrintTitle
                                        relationshipTemplate={relationshipTemplates[expandedRelationship.relationship.templateId]}
                                        isExpandedEntityRelationshipSource={expandedRelationship.isMainEntityIsRelationshipSource}
                                    />
                                </Grid>
                                <Box padding="0.2rem">
                                    <EntityPropertiesInternal
                                        properties={relatedEntity.properties}
                                        entityTemplate={entityTemplates[relatedEntity.templateId]}
                                        darkMode={false}
                                        showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                                        mode="normal"
                                        textWrap
                                        isPrintingMode
                                    />
                                </Box>
                            </>
                        );
                    })}
                </>
            )}
        </Box>
    );
};
export { EntityComponentToPrint };
