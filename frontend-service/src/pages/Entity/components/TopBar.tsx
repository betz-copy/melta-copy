import { AppRegistration } from '@mui/icons-material';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { IEntityExpanded } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import React from 'react';
import { Link } from 'wouter';
import { CustomIcon } from '../../../common/CustomIcon';
import { EntityTemplateColor } from '../../../common/EntityTemplateColor';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getEntityTemplateColor } from '../../../utils/colors';
import { INestedRelationshipTemplates } from '..';
import { ActivityLog } from './activityLog';
import { Print } from './print';

const EntityTopBar: React.FC<{
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    expandedEntity: IEntityExpanded;
    connectionsTemplates: INestedRelationshipTemplates[];
}> = ({ entityTemplate, expandedEntity, connectionsTemplates }) => {
    const theme = useTheme();

    const darkMode = useDarkModeStore((state) => state.darkMode);
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
                <Grid>
                    <EntityTemplateColor entityTemplateColor={entityTemplateColor} />
                </Grid>
                <Grid sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                    {entityTemplate.iconFileId ? (
                        <CustomIcon iconUrl={entityTemplate.iconFileId} height="30px" width="30px" color={theme.palette.primary.main} />
                    ) : (
                        <AppRegistration sx={{ color: theme.palette.primary.main }} />
                    )}
                </Grid>
                <Grid>
                    <Link href={`/category/${entityTemplate.category._id}`} style={{ textDecoration: 'none' }}>
                        <Typography color={theme.palette.primary.main} fontWeight="400" component="h4" variant="h4" fontSize="20px">
                            {entityTemplate.category.displayName}
                        </Typography>
                    </Link>
                </Grid>
                <Grid>
                    <Typography color={theme.palette.primary.main} fontWeight="400" component="h4" variant="h4" fontSize="20px">
                        {'>'}
                    </Typography>
                </Grid>
                <Grid>
                    <Typography color={theme.palette.primary.main} fontWeight="700" component="h4" variant="h4" fontSize="24px">
                        {entityTemplate.displayName}
                    </Typography>
                </Grid>
            </Box>
            <Box>
                <Print entityTemplate={entityTemplate} expandedEntity={expandedEntity} connections={connectionsTemplates} />
                <ActivityLog entityTemplate={entityTemplate} expandedEntity={expandedEntity} />
            </Box>
        </Box>
    );
};

export { EntityTopBar };
