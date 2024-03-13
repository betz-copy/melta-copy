import React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { IEntityExpanded } from '../../../interfaces/entities';
import { ActivityLog } from './activityLog';
import { Print } from './print';
import { IMongoCategory } from '../../../interfaces/categories';
import { RootState } from '../../../store';
import { CustomIcon } from '../../../common/CustomIcon';
import { getEntityTemplateColor } from '../../../utils/colors';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import { IConnectionTemplateOfExpandedEntity } from '..';

const EntityTopBar: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
    expandedEntity: IEntityExpanded;
    connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    categoriesWithConnectionsTemplates: {
        category: IMongoCategory;
        connectionsTemplates: IConnectionTemplateOfExpandedEntity[];
    }[];
}> = ({ entityTemplate, expandedEntity, categoriesWithConnectionsTemplates, connectionsTemplates }) => {
    const theme = useTheme();

    const darkMode = useSelector((state: RootState) => state.darkMode);
    const entityTemplateColor = getEntityTemplateColor(entityTemplate);

    return (
        <Box
            bgcolor={darkMode ? '#131313' : '#fcfeff'}
            height="3.6rem"
            paddingRight="2.5rem"
            paddingTop="0.5rem"
            paddingLeft="2rem"
            paddingBottom="0.4rem"
            boxShadow="0px 4px 4px #0000000D"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            position="sticky"
            style={{ top: 0, right: 0, zIndex: 1 }}
        >
            <Box display="flex" alignItems="center" gap="15px">
                <Grid item>
                    <EntityTemplateColor entityTemplateColor={entityTemplateColor} />
                </Grid>
                <Grid item sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                    {entityTemplate.iconFileId && (
                        <CustomIcon iconUrl={entityTemplate.iconFileId || ''} height="30px" width="30px" color={theme.palette.primary.main} />
                    )}
                </Grid>
                <Grid item>
                    <NavLink to={`/category/${entityTemplate.category._id}`} style={{ textDecoration: 'none' }}>
                        <Typography color={theme.palette.primary.main} fontWeight="400" component="h4" variant="h4" fontSize="20px">
                            {entityTemplate.category.displayName}
                        </Typography>
                    </NavLink>
                </Grid>
                <Grid item>
                    <Typography color={theme.palette.primary.main} fontWeight="400" component="h4" variant="h4" fontSize="20px">
                        {'>'}
                    </Typography>
                </Grid>
                <Grid item>
                    <Typography color={theme.palette.primary.main} fontWeight="700" component="h4" variant="h4" fontSize="24px">
                        {entityTemplate.displayName}
                    </Typography>
                </Grid>
            </Box>
            <Box>
                <Print
                    entityTemplate={entityTemplate}
                    expandedEntity={expandedEntity}
                    categoriesWithConnectionsTemplates={categoriesWithConnectionsTemplates}
                    connectionsTemplates={connectionsTemplates}
                />
                <ActivityLog entityTemplate={entityTemplate} expandedEntity={expandedEntity} />
            </Box>
        </Box>
    );
};

export { EntityTopBar };
