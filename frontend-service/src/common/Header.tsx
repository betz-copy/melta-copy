import React from 'react';
import { Grid } from '@mui/material';
import { BlueTitle } from './BlueTitle';

const Header: React.FC<{ title: string }> = ({ title, children }) => {
    return (
        <Grid
            item
            container
            justifyContent="space-between"
            alignItems="center"
            marginBottom="2%"
            style={{ height: '9vh', borderBottom: '1px solid #00000027' }}
        >
            <Grid item>
                <BlueTitle title={title} component="h3" variant="h3" />
            </Grid>
            <Grid item display="flex">
                {children}
            </Grid>
        </Grid>
    );
};

export { Header };
