import React from 'react';
import { Grid, Typography } from '@mui/material';
import '../css/realtionshipTitle.css';

const RelationshipTitle: React.FC<{
    sourceEntityTemplateDisplayName: string;
    relationshipTemplateDisplayName: string;
    destinationEntityTemplateDisplayName: string;

}> = ({ sourceEntityTemplateDisplayName, relationshipTemplateDisplayName, destinationEntityTemplateDisplayName }) => {
    return (
        <Grid container justifyContent="space-between" alignItems="center">
            <Grid item marginRight="20px">
                <Typography variant="h6">{sourceEntityTemplateDisplayName}</Typography>
            </Grid>
            <Grid item className="arrow">
                <span className="arrowText">{relationshipTemplateDisplayName}</span>
            </Grid>
            <Grid item marginLeft="40px">
                <Typography variant="h6">{destinationEntityTemplateDisplayName}</Typography>
            </Grid>
        </Grid>
    );
};

export { RelationshipTitle };
