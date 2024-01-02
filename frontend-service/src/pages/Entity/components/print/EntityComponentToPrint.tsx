import React from 'react';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import { IEntity } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { EntityDisableCheckbox } from '../EntityDisableCheckbox';
import { EntityDates } from '../EntityDates';
import { RootState } from '../../../../store';
import { lightTheme } from '../../../../theme';

const EntityComponentToPrint: React.FC<{ entityTemplate: IMongoEntityTemplatePopulated; entity: IEntity; options?: { showDates?: boolean } }> = ({
    entityTemplate,
    entity,
    options = { showDates: true },
}) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    return (
        <Box border={`2px solid ${lightTheme.palette.primary.main}`} borderRadius="20px" padding="1rem" style={{ pageBreakInside: 'avoid' }}>
            <Box padding="0.2rem">
                <EntityPropertiesInternal
                    properties={entity.properties}
                    entityTemplate={entityTemplate}
                    darkMode={darkMode}
                    showPreviewPropertiesOnly
                />
            </Box>

            <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled}> </EntityDisableCheckbox>

            {options.showDates && <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} />}
        </Box>
    );
};

export { EntityComponentToPrint };
