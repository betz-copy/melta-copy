import { Box, SxProps, Typography, useTheme } from '@mui/material';
import { IConnection, IEntity } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { IMongoRelationshipTemplatePopulated } from '@packages/relationship-template';
import i18next from 'i18next';
import React from 'react';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import BlueTitle from '../../../../common/MeltaDesigns/BlueTitle';
import { INestedRelationshipTemplates } from '../..';
import { EntityDates } from '../EntityDates';
import { EntityDisableCheckbox } from '../EntityDisableCheckbox';
import { renderConnectionTree } from './ComponentToPrint';

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
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    entity: IEntity;
    options: {
        showEntityDates: boolean;
        showDisabled: boolean;
    };
    showPreviewPropertiesOnly?: boolean;
    expandedRelationships?: { instances: IConnection[]; templates: INestedRelationshipTemplates[] };
}> = ({ entityTemplate, entity, options, showPreviewPropertiesOnly, expandedRelationships }) => {
    const theme = useTheme();

    return (
        <Box border={`2px solid ${theme.palette.primary.main}`} borderRadius="20px" padding="1rem">
            <Box padding="0.2rem">
                <EntityPropertiesInternal
                    properties={entity.properties}
                    coloredFields={entity.coloredFields}
                    entityTemplate={entityTemplate}
                    darkMode={false}
                    showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                    mode="normal"
                    textWrap
                    isPrintingMode
                    showByGroups
                />
            </Box>
            <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled} />
            {options.showEntityDates && <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} toPrint />}

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
                        {renderConnectionTree(entity, expandedRelationships.templates, expandedRelationships.instances, options)}
                    </div>
                )}
        </Box>
    );
};
export { EntityComponentToPrint };
