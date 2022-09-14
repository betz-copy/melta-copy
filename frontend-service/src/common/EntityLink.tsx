import { Tooltip } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { IEntity } from '../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';
import { EntityProperties } from './EntityProperties';

interface EntityLinkProps {
    entity: IEntity | null;
    entityTemplate: IMongoEntityTemplatePopulated | null;
}

export const EntityLink: React.FC<EntityLinkProps> = ({ entity, entityTemplate }) => {
    const linkText = entityTemplate ? entityTemplate.displayName : i18next.t('ruleBreachInfo.updateEntityActionInfo.unknownEntity');
    const link = `/entity/${entity ? entity.properties._id : 'unknownEntity'}`;

    const tooltip =
        entity && entityTemplate ? <EntityProperties properties={entity.properties} entityTemplate={entityTemplate} showPreviewPropertiesOnly /> : '';

    return (
        <Tooltip title={tooltip}>
            <NavLink to={link} style={{ color: '#225AA7', textDecoration: 'inherit', fontWeight: 'bold' }}>
                {linkText}
            </NavLink>
        </Tooltip>
    );
};
