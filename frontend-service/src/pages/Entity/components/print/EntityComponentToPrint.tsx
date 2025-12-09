import { Box, SxProps, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import BlueTitle from '../../../../common/MeltaDesigns/BlueTitle';
import { IEntity } from '../../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { IMongoRelationshipTemplatePopulated, IRelationshipTemplateMap } from '../../../../interfaces/relationshipTemplates';
import { EntityDates } from '../EntityDates';
import { EntityDisableCheckbox } from '../EntityDisableCheckbox';
import { IEntityTreeNode, renderChildrenTree } from './ComponentToPrint';

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
    options: {
        showEntityDates: boolean;
        showDisabled: boolean;
    };
    showPreviewPropertiesOnly?: boolean;
    hierarchicalChildren?: IEntityTreeNode[];
}> = ({ entityTemplate, entity, options, showPreviewPropertiesOnly, hierarchicalChildren }) => {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const relationships = queryClient.getQueryData<IRelationshipTemplateMap>('getRelationshipTemplates')!;

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

            {/* Render hierarchical children if provided */}
            {hierarchicalChildren?.length && (
                <div>
                    <BlueTitle title={i18next.t('entityPage.print.relationships')} component="p" variant="h6" style={{ marginTop: '5px' }} />
                    {renderChildrenTree(entity as IEntityTreeNode, entityTemplates, relationships, options, 1)}
                </div>
            )}
        </Box>
    );
};
export { EntityComponentToPrint };
