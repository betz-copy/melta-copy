import React from 'react';
import { Box } from '@mui/material';
import { EntityProperties } from '../../../common/EntityProperties';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { EntityDisableCheckbox } from './EntityDisableCheckbox';
import { EntityDates } from './EntityDates';

const EntityComponentToPrint: React.FC<{ entityTemplate: IMongoEntityTemplatePopulated; entity: IEntity; options?: { showDates?: boolean } }> = ({
    entityTemplate,
    entity,
    options = { showDates: true },
}) => {
    return (
        <Box border="2px solid rgb(25, 118, 210)" borderRadius="20px" padding="1rem" style={{ pageBreakInside: 'avoid' }}>
            <Box padding="0.2rem">
                <EntityProperties entityTemplate={entityTemplate} properties={entity.properties} />
            </Box>

            <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled}> </EntityDisableCheckbox>

            {options.showDates && <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} />}
        </Box>
    );
};

export { EntityComponentToPrint };
