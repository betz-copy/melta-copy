import React from 'react';
import { Box, Typography } from '@mui/material';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntityExpanded } from '../../../interfaces/entities';
import { IMongoRelationshipTemplatePopulated } from '../../../interfaces/relationshipTemplates';
import { ActivityLog } from './ActivityLog';
import { Print } from './Print';
import { IMongoCategory } from '../../../interfaces/categories';

const EntityTopBar: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    relevantRelationshipTemplates: IMongoRelationshipTemplatePopulated[];
    categoriesWithRelationshipTemplates: (IMongoCategory & {
        relationshipTemplates: IMongoRelationshipTemplatePopulated[];
    })[];
}> = ({ entityTemplate, expandedEntity, categoriesWithRelationshipTemplates, relevantRelationshipTemplates }) => {
    return (
        <Box
            bgcolor="#fcfeff"
            paddingRight="2.5rem"
            paddingTop="0.5rem"
            paddingLeft="2.5rem"
            paddingBottom="0.4rem"
            boxShadow="0px 4px 4px #0000000D"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
        >
            <Box display="flex" alignItems="center">
                <Typography color="#1976d2" fontWeight="800" component="h4" variant="h4">
                    {entityTemplate.category.displayName}
                </Typography>

                <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                    /
                </Typography>

                <Typography paddingBottom="2px" variant="h4" fontSize="28px" color="rgb(25, 118, 210)">
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
