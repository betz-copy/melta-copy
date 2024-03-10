import { useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { Link } from 'wouter';
import { IEntity } from '../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { useDarkModeStore } from '../stores/darkMode';
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
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const tooltip =
        // eslint-disable-next-line no-nested-ternary
        !entityTemplate || !entity ? (
            ''
        ) : !entityTemplate.propertiesPreview.length ? (
            i18next.t('graph.noPreviewProperties')
        ) : (
            <EntityPropertiesInternal
                properties={entity.properties}
                entityTemplate={entityTemplate}
                darkMode={darkMode}
                showPreviewPropertiesOnly
                mode="white"
            />
        );

    return (
        <MeltaTooltip title={tooltip}>
            <Link href={link} style={{ color: theme.palette.primary.main, textDecoration: 'inherit', fontWeight: 'bold' }}>
                {linkText}
            </Link>
        </MeltaTooltip>
    );
};
