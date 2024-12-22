import { Box, Grid } from '@mui/material';
import React from 'react';
import { IMongoEntityTemplatePopulated } from '../interfaces/entityTemplates';

interface EntityTemplatesTreeProps {
    title: string;
    entityTemplates: IMongoEntityTemplatePopulated[];
}

const EntityTemplatesTree: React.FC<EntityTemplatesTreeProps> = ({ title, entityTemplates }) => {
    return (
        <Box>
            <Grid container>
                <Grid item>{title}</Grid>
                {entityTemplates.map((entityTemplate) => (
                    <Grid key={entityTemplate._id} container>
                        <Grid item>{entityTemplate.displayName}</Grid>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export { EntityTemplatesTree };
