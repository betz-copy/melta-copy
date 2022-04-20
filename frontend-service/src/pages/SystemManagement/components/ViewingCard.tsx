import React, { MouseEventHandler } from 'react';
import { Grid, IconButton, Card, CardHeader, CardActions } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const ViewingCard: React.FC<{ title: string; icon?: React.ReactNode; onEditClick: MouseEventHandler; onDeleteClick: MouseEventHandler }> = ({
    title,
    icon,
    onEditClick,
    onDeleteClick,
}) => {
    return (
        <Grid item>
            <Card sx={{ minWidth: '250px', ':hover': { transform: 'scale(1.05)' } }}>
                <CardHeader avatar={icon} title={title} titleTypographyProps={{ fontSize: '1.5rem' }} />
                <CardActions sx={{ justifyContent: 'space-between' }}>
                    <IconButton onClick={onEditClick}>
                        <EditIcon />
                    </IconButton>
                    <IconButton onClick={onDeleteClick}>
                        <DeleteIcon />
                    </IconButton>
                </CardActions>
            </Card>
        </Grid>
    );
};

export { ViewingCard };
