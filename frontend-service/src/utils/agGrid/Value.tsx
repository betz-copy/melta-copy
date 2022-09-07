/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, Typography, Grid } from '@mui/material';

const Value: React.FC<{ hideValue: boolean; value: string }> = ({ hideValue, value }) => {
    const [hideField, setHideField] = React.useState(true);
    const handleClick = () => {
        setHideField((curr) => !curr);
    };
    if (!hideValue) return <>{value} </>;

    return (
        <Grid container justifyContent="space-between" alignItems="center" direction="row">
            <Typography
                fontFamily="Rubik"
                fontSize="16px"
                fontWeight="200"
                style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '70%' }}
            >
                {hideField ? <>••••••••</> : value}
            </Typography>
            <IconButton onClick={handleClick}>{hideField ? <VisibilityOff /> : <Visibility />}</IconButton>
        </Grid>
    );
};

export { Value };
