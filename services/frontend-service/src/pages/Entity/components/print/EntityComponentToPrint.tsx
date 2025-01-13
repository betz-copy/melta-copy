import React from 'react';
import { Box, useTheme } from '@mui/material';
import { IEntity, IMongoEntityTemplatePopulated } from '@microservices/shared-interfaces';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import { EntityDisableCheckbox } from '../EntityDisableCheckbox';
import { EntityDates } from '../EntityDates';

const EntityComponentToPrint: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    entity: IEntity;
    options?: { showDates?: boolean };
    showPreviewPropertiesOnly?: boolean;
}> = ({ entityTemplate, entity, options = { showDates: true }, showPreviewPropertiesOnly }) => {
    const theme = useTheme();

    return (
        <Box border={`2px solid ${theme.palette.primary.main}`} borderRadius="20px" padding="1rem">
            <Box padding="0.2rem">
                <EntityPropertiesInternal
                    properties={entity.properties}
                    entityTemplate={entityTemplate}
                    darkMode={false}
                    showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                    mode="normal"
                    textWrap
                    isPrintingMode
                />
            </Box>

            <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled} />

            {options.showDates && <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} toPrint />}
        </Box>
    );
};
export { EntityComponentToPrint };
