import React, { MouseEventHandler } from 'react';
import { Typography, Grid } from '@mui/material';
import { InfoCard } from './InfoCard';
import { AddCard } from './AddCard';

const CardRow: React.FC<{ onClick: MouseEventHandler; text: string; rowValues: { _id: string; displayName: string }[] }> = ({
    onClick,
    text,
    rowValues,
}) => {
    return (
        <Grid item xs={12}>
            <Typography variant="h2">{text}</Typography>
            <Grid container spacing={4} textAlign="center">
                {rowValues.map((rowValue) => (
                    <InfoCard key={rowValue._id} text={rowValue.displayName} />
                ))}
                <AddCard onClick={onClick} />
            </Grid>
        </Grid>
    );
};

export { CardRow };
