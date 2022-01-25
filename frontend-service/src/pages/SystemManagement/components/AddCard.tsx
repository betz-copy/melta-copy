import React, { MouseEventHandler } from 'react';
import { Card, CardContent, IconButton, Grid } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const AddCard: React.FC<{ onClick: MouseEventHandler }> = ({ onClick }) => {
    return (
        <Grid item>
            <Card>
                <CardContent>
                    <IconButton onClick={onClick}>
                        <AddIcon fontSize="large" />
                    </IconButton>
                </CardContent>
            </Card>
        </Grid>
    );
};

export { AddCard };
