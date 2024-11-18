import { Box, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { CSSProperties } from 'react';
import { Link } from 'wouter';
import { IEntity, IMongoEntityTemplatePopulated } from '@microservices/shared';
import { useDarkModeStore } from '../stores/darkMode';
import { EntityPropertiesInternal } from './EntityProperties';
import { MeltaTooltip } from './MeltaTooltip';
import { environment } from '../globals';

interface EntityLinkProps {
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

    const linkText = entityTemplate ? entityTemplate.displayName : i18next.t('ruleBreachInfo.updateEntityActionInfo.unknownEntity');
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const entityPropertiesTooltip =
        // eslint-disable-next-line no-nested-ternary
        !entityTemplate || !entity ? (
            ''
        ) : !entityTemplate.propertiesPreview.length ? (
            i18next.t('graph.noPreviewProperties')
        ) : (
            <Grid style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <EntityPropertiesInternal
                    properties={entity.properties}
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
                        fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                    }}
                >
                    {linkText}
                </Link>
            ) : (
                <Box
                    component="span"
                    sx={{ color: theme.palette.primary.main, fontWeight: 'bold', fontSize: environment.mainFontSizes.headlineSubTitleFontSize }}
                >
                    {linkText}
                </Box>
            )}
        </MeltaTooltip>
    );
};
