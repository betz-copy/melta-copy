import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

const DuplicateTopBar: React.FC<{
    entityTemplate: IMongoEntityTemplatePopulated;
}> = ({ entityTemplate }) => {
    const theme = useTheme();

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
            position="sticky"
            style={{ top: 0, right: 0, zIndex: 1 }}
        >
            <Box display="flex" alignItems="center">
                <Typography color={theme.palette.primary.main} fontWeight="800" component="h4" variant="h4">
                    {entityTemplate.category.displayName}
                </Typography>

                <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                    /
                </Typography>

                <Typography paddingBottom="2px" variant="h4" fontSize="28px" color={theme.palette.primary.main}>
                    {entityTemplate.displayName}
                </Typography>
            </Box>
        </Box>
    );
};

export { DuplicateTopBar };
