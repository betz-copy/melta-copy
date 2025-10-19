import { InfoOutlined } from '@mui/icons-material';
import { Grid, Typography, useTheme } from '@mui/material';
import React from 'react';

const InfoTypography: React.FC<{ text: string }> = ({ text }) => {
    const theme = useTheme();

    return (
        <Grid container direction="row" alignItems="center" wrap="nowrap" gap={1.5} marginTop={2}>
            <InfoOutlined style={{ color: theme.palette.primary.main }} />
            <Typography fontWeight={400} fontSize={14} color="#53566E">
                {text}
            </Typography>
        </Grid>
    );
};

export { InfoTypography };
