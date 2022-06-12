import React from 'react';

import { Grid, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, HorizontalRule as HorizontalRuleIcon } from '@mui/icons-material';

const RelationshipTitle: React.FC<{
    sourceEntityTemplateDisplayName: string;
    relationshipTemplateDisplayName: string;
    destinationEntityTemplateDisplayName: string;
}> = ({ sourceEntityTemplateDisplayName, relationshipTemplateDisplayName, destinationEntityTemplateDisplayName }) => {
    return (
        <Grid container justifyContent="space-between" marginTop="10px" width="250px">
            <Grid item>
                <Typography variant="h6">{sourceEntityTemplateDisplayName}</Typography>
            </Grid>
            <Grid item>
                <Grid container marginTop="-3px">
                    <Grid item style={{ position: 'relative' }}>
                        <HorizontalRuleIcon fontSize="small" style={{ position: 'relative', top: '6px' }} />
                    </Grid>
                    <Grid item>
                        <Typography
                            variant="body1"
                            style={{
                                fontSize: '15px',
                                position: 'relative',
                                top: '7px',
                                color: 'rgb(25, 118, 210)',
                                fontWeight: '500',
                            }}
                        >
                            {relationshipTemplateDisplayName}
                        </Typography>
                    </Grid>
                    <Grid item style={{ position: 'relative', top: '1px' }}>
                        <ArrowBackIcon fontSize="small" style={{ position: 'relative', top: '6px' }} />
                    </Grid>
                </Grid>
            </Grid>
            <Grid item>
                <Typography variant="h6">{destinationEntityTemplateDisplayName}</Typography>
            </Grid>
        </Grid>
    );
};

export { RelationshipTitle };
