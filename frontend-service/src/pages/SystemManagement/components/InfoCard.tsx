import React from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';

const InfoCard: React.FC<{ key: string; text: string }> = ({ key, text }) => {
    return (
        <Grid item key={key}>
            <Card>
                <CardContent>
                    <Typography variant="h3">{text}</Typography>
                </CardContent>
            </Card>
        </Grid>
    );
};

export { InfoCard };
