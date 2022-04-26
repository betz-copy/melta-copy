import React from 'react';

import { Grid, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon, HorizontalRule as HorizontalRuleIcon } from '@mui/icons-material';

const RelationshipTitle: React.FC<{
    sourceEntityTemplateDisplayName: string;
    relationshipTemplateDisplayName: string;
    destinationEntityTemplateDisplayName: string;
}> = ({ sourceEntityTemplateDisplayName, relationshipTemplateDisplayName, destinationEntityTemplateDisplayName }) => {
    return (
        <Grid container justifyContent="space-between">
            <Grid item>
                <Typography variant="h5" style={{ fontWeight: '400', fontSize: '25px' }}>
                    {sourceEntityTemplateDisplayName}
                </Typography>
            </Grid>
            <Grid item>
                <Grid container>
                    <Grid item style={{ position: 'relative' }}>
                        <HorizontalRuleIcon fontSize="small" style={{ position: 'relative', top: '5px' }} />
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
                        <ArrowBackIcon fontSize="medium" style={{ position: 'relative', top: '5px' }} />
                    </Grid>
                </Grid>
            </Grid>
            <Grid item>
                <Typography variant="h5" style={{ fontWeight: '400', fontSize: '25px' }}>
                    {destinationEntityTemplateDisplayName}
                </Typography>
            </Grid>
        </Grid>
    );
};

export { RelationshipTitle };
