import { Box, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { Link } from 'wouter';
import { IEntity } from '../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { useDarkModeStore } from '../stores/darkMode';
import { useWorkspaceStore } from '../stores/workspace';
import { getFirstXFilledPropsKeys } from '../utils/templates';
import { EntityPropertiesInternal } from './EntityProperties';
import MeltaTooltip from './MeltaDesigns/MeltaTooltip';

export interface EntityLinkProps {
    entity: IEntity | null;
    entityTemplate: IMongoEntityTemplatePopulated | null;
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
    const entityPropertiesTooltip = (() => {
        if (!entityTemplate || !entity) {
            return i18next.t('ruleBreachInfo.deletedEntity');
        }

        const fieldsToShow = entityPropertiesToShowTooltipOverride ?? getFirstXFilledPropsKeys(5, entityTemplate, entity);

        return fieldsToShow.length === 0 ? (
            i18next.t('graph.noPreviewProperties')
        ) : (
            <Grid style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <EntityPropertiesInternal
                    properties={entity.properties}
                    coloredFields={entity.coloredFields}
                    entityTemplate={entityTemplate}
                    darkMode={darkMode}
                    overridePropertiesToShow={fieldsToShow}
                    propertiesToHighlight={entityPropertiesToHighlightTooltip}
                    propertiesToHighlightColor={entityPropertiesToHighlightColor}
                    mode="white"
                />
            </Grid>
        );
    })();

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
