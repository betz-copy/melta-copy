import { Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
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
}

export const EntityLink: React.FC<EntityLinkProps> = ({ entity, entityTemplate }) => {
    const theme = useTheme();

    const linkText = entityTemplate ? entityTemplate.displayName : i18next.t('ruleBreachInfo.updateEntityActionInfo.unknownEntity');
    const link = `/entity/${entity ? entity.properties._id : 'unknownEntity'}`;
    const darkMode = useSelector((state: RootState) => state.darkMode);
    const tooltip =
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
                    mode="white"
                    textWrap
                />
            </Grid>
        );

    return (
        <MeltaTooltip title={tooltip}>
            <NavLink to={link} style={{ color: theme.palette.primary.main, textDecoration: 'inherit', fontWeight: 'bold', fontSize: '14px' }}>
                {linkText}
            </NavLink>
        </MeltaTooltip>
    );
};
