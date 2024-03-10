import React from 'react';
import { Box, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { EntityPropertiesInternal } from '../../../../common/EntityProperties';
import { IEntity, IFile } from '../../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../../interfaces/entityTemplates';
import { EntityDisableCheckbox } from '../EntityDisableCheckbox';
import { EntityDates } from '../EntityDates';
import { RootState } from '../../../../store';

const EntityComponentToPrint: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    entity: IEntity;
    options?: { showDates?: boolean };
    showPreviewPropertiesOnly?: boolean;
    files?: IFile[];
}> = ({ entityTemplate, entity, options = { showDates: true }, showPreviewPropertiesOnly, files }) => {
    const theme = useTheme();

    const darkMode = useSelector((state: RootState) => state.darkMode);
    console.log({ entity });
    console.log({ entityTemplate });

    return (
        <Box border={`2px solid ${theme.palette.primary.main}`} borderRadius="20px" padding="1rem" style={{ pageBreakInside: 'avoid' }}>
            <Box padding="0.2rem">
                <EntityPropertiesInternal
                    properties={entity.properties}
                    entityTemplate={entityTemplate}
                    darkMode={darkMode}
                    showPreviewPropertiesOnly={showPreviewPropertiesOnly}
                    files={files}
                    mode="normal"
                    textWrap
                />
            </Box>

            <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled}> </EntityDisableCheckbox>

            {options.showDates && <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} />}
        </Box>
    );
};

export { EntityComponentToPrint };
