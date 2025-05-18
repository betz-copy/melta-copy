import React from 'react';
import { Grid } from '@mui/material';
import { useQuery } from 'react-query';
import { DashboardHeader } from './DashboardHeader';
import { getDashboardItems } from '../../services/dashboardService';
import { DashboardItems } from './dashboardItems';

const Dashboard: React.FC = () => {
    const { data: dashboardItems, isLoading } = useQuery({
        queryKey: ['getDashboard'],
        queryFn: () => getDashboardItems('jjjjjj'),
        initialData: [],
    });
    console.log({ dashboardItems, isLoading });
    return (
        <Grid>
            <DashboardHeader />
            <DashboardItems dashboardItems={dashboardItems} />
            {/* <DashboardSideBar /> */}
        </Grid>
    );
};

export default Dashboard;
