import React from 'react';
import { Grid } from '@mui/material';
import { DashboardHeader } from './DashboardHeader';

const Dashboard: React.FC = () => {
    return (
        <Grid>
            <DashboardHeader />
            {/* <DashboardSideBar /> */}
        </Grid>
    );
};

export default Dashboard;
