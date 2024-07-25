import React from 'react';
import { Box, useTheme } from '@mui/material';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import { IEntity } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { EntityDisableCheckbox } from '../EntityDisableCheckbox';
import { EntityDates } from '../EntityDates';
import { useDarkModeStore } from '../../../../stores/darkMode';

const EntityComponentToPrint: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    entity: IEntity;
    options?: { showDates?: boolean };
    showPreviewPropertiesOnly?: boolean;
}> = ({ entityTemplate, entity, options = { showDates: true }, showPreviewPropertiesOnly }) => {
    const theme = useTheme();

    const darkMode = useDarkModeStore((state) => state.darkMode);

    return (
        <Box border={`2px solid ${theme.palette.primary.main}`} borderRadius="20px" padding="1rem">
            <Box padding="0.2rem">
                <EntityPropertiesInternal
                    properties={entity.properties}
                    entityTemplate={entityTemplate}
                    darkMode={darkMode}
                    showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                    mode="normal"
                    textWrap
                    isPrintingMode
                />
            </Box>

            <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled}> </EntityDisableCheckbox>

            {options.showDates && <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} />}
        </Box>
    );
};
export { EntityComponentToPrint };
