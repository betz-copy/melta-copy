import React from 'react';
import { Box, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntityExpanded } from '../../../interfaces/entities';
import { IMongoRelationshipTemplatePopulated } from '../../../interfaces/relationshipTemplates';
import { ActivityLog } from './activityLog';
import { Print } from './print';
import { IMongoCategory } from '../../../interfaces/categories';
import { RootState } from '../../../store';
import { lightTheme } from '../../../theme';

const EntityTopBar: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    relevantRelationshipTemplates: IMongoRelationshipTemplatePopulated[];
    categoriesWithRelationshipTemplates: (IMongoCategory & {
        relationshipTemplates: IMongoRelationshipTemplatePopulated[];
    })[];
}> = ({ entityTemplate, expandedEntity, categoriesWithRelationshipTemplates, relevantRelationshipTemplates }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);

    return (
        <Box
            bgcolor={darkMode ? '#131313' : '#fcfeff'}
            height="3.6rem"
            paddingRight="2.5rem"
            paddingTop="0.5rem"
            paddingLeft="2.5rem"
            paddingBottom="0.4rem"
            boxShadow="0px 4px 4px #0000000D"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            position="sticky"
            style={{ top: 0, right: 0, zIndex: 1 }}
        >
            <Box display="flex" alignItems="center">
                <Typography color={lightTheme.palette.primary.main} fontWeight="800" component="h4" variant="h4">
                    {entityTemplate.category.displayName}
                </Typography>

                <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                    /
                </Typography>

                <Typography paddingBottom="2px" variant="h4" fontSize="28px" color={lightTheme.palette.primary.main}>
                    {entityTemplate.displayName}
                </Typography>
            </Box>
            <Box>
                <Print
                    entityTemplate={entityTemplate}
                    expandedEntity={expandedEntity}
                    categoriesWithRelationshipTemplates={categoriesWithRelationshipTemplates}
                    relevantRelationshipTemplates={relevantRelationshipTemplates}
                />
                <ActivityLog entityTemplate={entityTemplate} expandedEntity={expandedEntity} />
            </Box>
        </Box>
    );
};

export { EntityTopBar };
