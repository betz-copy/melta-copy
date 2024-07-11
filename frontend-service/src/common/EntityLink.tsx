import React, { CSSProperties } from 'react';
import { Box, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { IEntity } from '../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { RootState } from '../store';
import { EntityPropertiesInternal } from './EntityProperties';
import { MeltaTooltip } from './MeltaTooltip';

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
    const darkMode = useSelector((state: RootState) => state.darkMode);
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
                <NavLink
                    to={`/entity/${entity ? entity.properties._id : 'unknownEntity'}`}
                    style={{ color: theme.palette.primary.main, textDecoration: 'inherit', fontWeight: 'bold' }}
                >
                    {linkText}
                </NavLink>
            ) : (
                <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 'bold', fontSize: '14px' }}>
                    {linkText}
                </Box>
            )}
        </MeltaTooltip>
    );
};
