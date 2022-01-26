import React, { MouseEventHandler } from 'react';
import { Card, CardContent, Grid, Typography } from '@mui/material';

const InfoCard: React.FC<{ text: string; onClick?: MouseEventHandler }> = ({ text, onClick = () => {} }) => {
    return (
        <Grid item onClick={onClick}>
            <Card>
                <CardContent>
                    <Typography variant="h3">{text}</Typography>
                </CardContent>
            </Card>
        </Grid>
    );
};

export { InfoCard };
