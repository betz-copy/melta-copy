import { Box, Grid, useTheme } from '@mui/material';
import { IEntity } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { Link } from 'wouter';
import { useDarkModeStore } from '../stores/darkMode';
import { useWorkspaceStore } from '../stores/workspace';
import { EntityPropertiesInternal } from './EntityProperties';
import MeltaTooltip from './MeltaDesigns/MeltaTooltip';

export interface EntityLinkProps {
    entity: IEntity | null;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated | null;
    linkable?: boolean;
    entityPropertiesToShowTooltipOverride?: string[];
    entityPropertiesToHighlightTooltip?: string[];
    entityPropertiesToHighlightColor?: CSSProperties['color'];
    tooltipHeader?: React.ReactNode;
}

export const EntityLink: React.FC<EntityLinkProps> = ({
    entity,
    entityTemplate,
    linkable = true,
    entityPropertiesToShowTooltipOverride,
    entityPropertiesToHighlightTooltip,
    entityPropertiesToHighlightColor,
    tooltipHeader,
}) => {
    const theme = useTheme();
    const workspace = useWorkspaceStore((state) => state.workspace);
    const { headlineSubTitleFontSize } = workspace.metadata.mainFontSizes;

    const linkText = entityTemplate ? entityTemplate.displayName : i18next.t('ruleBreachInfo.updateEntityActionInfo.unknownEntity');
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const entityPropertiesTooltip =
        !entityTemplate || !entity ? (
            i18next.t('ruleBreachInfo.deletedEntity')
        ) : !entityTemplate.propertiesPreview.length ? (
            i18next.t('graph.noPreviewProperties')
        ) : (
            <Grid style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <EntityPropertiesInternal
                    properties={entity.properties}
                    coloredFields={entity.coloredFields}
                    entityTemplate={entityTemplate}
                    darkMode={darkMode}
                    showPreviewPropertiesOnly
                    overridePropertiesToShow={entityPropertiesToShowTooltipOverride}
                    propertiesToHighlight={entityPropertiesToHighlightTooltip}
                    propertiesToHighlightColor={entityPropertiesToHighlightColor}
                    mode="white"
                />
            </Grid>
        );

    return (
        <MeltaTooltip
            title={
                <Grid container direction="column" alignItems="center">
                    {tooltipHeader}
                    {entityPropertiesTooltip}
                </Grid>
            }
        >
            {linkable ? (
                <Link
                    to={`/entity/${entity && typeof entity !== 'string' ? entity.properties._id : 'unknownEntity'}`}
                    style={{
                        color: theme.palette.primary.main,
                        textDecoration: 'inherit',
                        fontWeight: 'bold',
                        fontSize: headlineSubTitleFontSize,
                    }}
                >
                    {linkText}
                </Link>
            ) : (
                <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 'bold', fontSize: headlineSubTitleFontSize }}>
                    {linkText}
                </Box>
            )}
        </MeltaTooltip>
    );
};
